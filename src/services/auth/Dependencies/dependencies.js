import { AuthController } from "../controller/authController.js";
import { AuthService } from "../service/authService.js";
import MongoUserRepository from "../repository/UserRepository.js";
import MongoClientRepository from "../../client/repository/ClientRepository.js";
import MongoApiKeyRepository from "../../client/repository/ApiKeyRepository.js";

/**
 * Dependency Injection Container for the Auth module.
 * This container initializes and manages the dependencies for the Auth module,
 * including repositories, services, and controllers.
 */
class Container {
    static init() {
        // Initialize repositories
        const repositories = {
            userRepository: MongoUserRepository,
            clientRepository: MongoClientRepository,
            apiKeyRepository: MongoApiKeyRepository
        };

        // Initialize services with their respective repositories
        const services = {
            authService: new AuthService({
                userRepository: repositories.userRepository,
                clientRepository: repositories.clientRepository,
                apiKeyRepository: repositories.apiKeyRepository
            })
        };

        // Initialize controllers with their respective services
        const controller = {
            authController: new AuthController(services.authService)
        }

        return {
            repositories, services, controller
        }
    }
}

const initialized = Container.init();
export { Container };
export default initialized