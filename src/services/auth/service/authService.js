import config from "../../../shared/config/index.js";
import AppError from "../../../shared/utils/AppError.js";
import jwt from "jsonwebtoken";
import logger from "../../../shared/config/logger.js"
import bcrypt from "bcryptjs";
import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * AuthService handles user authentication and authorization related operations such as onboarding super admin, user registration, login, and fetching user profile.
 * It interacts with the UserRepository to perform these operations and generates JWT tokens for authenticated users.
 */
export class AuthService {
    constructor(dependencies) {
        if (!dependencies) {
            throw new Error("UserRepository/Dependencies is Required");
        }
        if (dependencies.userRepository) {
            this.userRepository = dependencies.userRepository;
            this.clientRepository = dependencies.clientRepository;
            this.apiKeyRepository = dependencies.apiKeyRepository;
        } else {
            this.userRepository = dependencies;
        }
    };

    generateSlug(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    generateApiKey() {
        const prefix = "apim";
        const randomBytes = crypto.randomBytes(20).toString("hex");
        return `${prefix}_${randomBytes}`;
    }

    /**
     * Self-registers a new Client and Client Admin user.
     */
    async clientSelfRegister(data) {
        try {
            const { companyName, username, email, password } = data;

            // Check if username/email exists
            const existingUser = await this.userRepository.findByUsername(username);
            if (existingUser) {
                throw new AppError("Username already exists", 409);
            }
            const existingEmail = await this.userRepository.findByEmail(email);
            if (existingEmail) {
                throw new AppError("Email already exists", 409);
            }

            // Create client organization (createdBy is set after user is created)
            const slug = this.generateSlug(companyName);
            let client = null;
            if (this.clientRepository) {
                const existingClient = await this.clientRepository.findBySlug(slug);
                if (existingClient) {
                    throw new AppError("An organization with this name already exists", 409);
                }

                client = await this.clientRepository.create({
                    name: companyName,
                    slug,
                    email,
                    description: `Self-registered client ${companyName}`,
                });
            }

            // Create Client Admin user
            const user = await this.userRepository.create({
                username,
                email,
                password,
                role: APPLICATION_ROLES.CLIENT_ADMIN,
                clientId: client ? client._id : null,
                permissions: {
                    canCreateApiKeys: true,
                    canManageUsers: true,
                    canViewAnalytics: true,
                    canExportData: true
                }
            });

            if (client) {
                await this.clientRepository.updateById(client._id, { createdBy: user._id });
            }

            // Auto-generate initial API Key if repository available
            if (client && this.apiKeyRepository) {
                const keyId = uuidv4();
                const keyValue = this.generateApiKey();
                await this.apiKeyRepository.create({
                    keyId,
                    keyValue,
                    clientId: client._id,
                    name: "Default API Key",
                    description: "Auto-generated upon self-registration",
                    environment: "production",
                    createdBy: user._id
                });
            }

            const token = this.generateToken(user);
            logger.info("Client self-registered successfully", { username: user.username, companyName });

            return {
                user: this.formatUserForResponse(user),
                token
            };
        } catch (error) {
            logger.error("Error in Client Self-Registration", error);
            throw error;
        }
    }

    /**
     * Generates a JWT token for the given user.
     * @param {Object} user - The user object for which the token is generated.
     * @returns {string} - The generated JWT token.
     */
    generateToken(user) {
        const { _id, email, username, role, clientId } = user;

        const payload = {
            userId: _id,
            username,
            email,
            role,
            clientId
        }

        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        })
    }

    /**
     * Formats the user object for response by removing sensitive information.
     * @param {Object} user - The user object to be formatted.
     * @returns {Object} - The formatted user object.
     */
    formatUserForResponse(user) {
        const userObj = user.toObject ? user.toObject() : { ...user };
        delete userObj.password;
        return userObj;
    };

    /**
     * Compares the user-entered password with the hashed password.
     * @param {string} userEnteredPassword - The password entered by the user.
     * @param {string} hashedPassword - The hashed password stored in the database.
     * @returns {Promise<boolean>} - Returns true if the passwords match, otherwise false.
     */
    async comparePassword(userEnteredPassword, hashedPassword) {
        return await bcrypt.compare(userEnteredPassword, hashedPassword)
    }

    /**
     * Onboards a new super admin user.
     * @param {Object} superAdminData - The data of the super admin to be onboarded.
     * @returns {Promise<Object>} - Returns an object containing the user and token.
     */
    async onboardSuperAdmin(superAdminData) {
        try {
            const existingUser = await this.userRepository.findAll();

            if (existingUser && existingUser.length > 0) {
                throw new AppError("Super admin onboarding is disabled", 403);
            }

            const user = await this.userRepository.create(superAdminData);
            const token = this.generateToken(user);

            logger.info("Admin onboarded successfully", {
                username: user.username
            })

            return {
                user: this.formatUserForResponse(user),
                token
            }
        } catch (error) {
            logger.error("Error in onboarding Super admin", error)
            throw error
        }
    };

    /**
     * Registers a new user.
     * @param {Object} userData - The data of the user to be registered.
     * @returns {Promise<Object>} - Returns an object containing the user and token.
     */
    async register(userData) {
        try {
            const existingUser = await this.userRepository.findByUsername(userData.username)
            if (existingUser) {
                throw new AppError("Username already exists", 409)
            };

            const existingEmail = await this.userRepository.findByEmail(userData.email)
            if (existingEmail) {
                throw new AppError("Email already exists", 409)
            };

            const user = await this.userRepository.create(userData);
            const token = this.generateToken(user);

            logger.info("User registered successfully", {
                username: user.username
            })

            return {
                user: this.formatUserForResponse(user),
                token
            }
        } catch (error) {
            logger.error("Error in Register service", error)
            throw error
        }
    };

    /**
     * Logs in a user.
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {Promise<Object>} - Returns an object containing the user and token.
     */
    async login(username, password) {
        try {
            const user = await this.userRepository.findByUsername(username);

            if (!user) {
                throw new AppError("Invliad Credentials", 401);
            };

            if (!user.isActive) {
                throw new AppError("Account is deactivated", 403);
            }

            const isPasswordValid = await this.comparePassword(password, user.password);
            if (!isPasswordValid) {
                throw new AppError("Invliad Credentials", 401);
            }
            const token = this.generateToken(user);

            logger.info("User loggedIn successfully", { username: user.username })

            return {
                user: this.formatUserForResponse(user),
                token
            }

        } catch (error) {
            logger.error("Error in Login service", error)
            throw error
        }
    };


    /**
     * Fetches the profile of a user by their ID.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Object>} - Returns the user's profile data.
     */
    async getProfile(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError('User not found', 404);
            }
            return this.formatUserForResponse(user)
        } catch (error) {
            logger.error('Error getting user profile:', error);
            throw error;
        }
    };


    async checkSuperAdminPermissions(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError("User not found", 404);
            }

            return user.role === APPLICATION_ROLES.SUPER_ADMIN
        } catch (error) {

        }
    }
}