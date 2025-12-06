import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignInDto } from '../users/dto/sign-in.dto';

// --- Mock Definition for AuthService ---
const mockAuthService = {
  // Mock the signIn method, which is the only one the controller calls
  signIn: jest.fn(),
};
// --- End Mock Definition ---

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService, // Provide our mock implementation
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    // Cast the retrieved mock to the AuthService type for easier testing setup
    authService = module.get<AuthService>(AuthService);

    // Ensure mock state is clean before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- signIn (POST /auth/login) tests ---
  describe('signIn', () => {
    const signInDto: SignInDto = { 
        email: 'test@user.com', 
        password: 'password123' 
    };
    const mockAccessToken = { access_token: 'mock-jwt-token' };

    it('should call authService.signIn and return an access token on successful login (200 OK)', async () => {
      // 1. Arrange: Set the mock service to resolve successfully
      (authService.signIn as jest.Mock).mockResolvedValue(mockAccessToken);

      // 2. Act: Call the controller method
      const result = await controller.signIn(signInDto);

      // 3. Assert: Check service call and controller response
      expect(authService.signIn).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(result).toEqual(mockAccessToken);
    });

    it('should pass the UnauthorizedException from the service up to the handler', async () => {
      // 1. Arrange: Set the mock service to reject with UnauthorizedException
      (authService.signIn as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // 2. Act & Assert: Expect the controller call to throw the exception
      await expect(controller.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.signIn).toHaveBeenCalledTimes(1);
    });

    it('should handle other unexpected errors from the service', async () => {
        // 1. Arrange: Set the mock service to reject with a generic Error
        (authService.signIn as jest.Mock).mockRejectedValue(
          new Error('Database connection failed'),
        );
  
        // 2. Act & Assert: Expect the controller call to throw the generic error
        await expect(controller.signIn(signInDto)).rejects.toThrow('Database connection failed');
        expect(authService.signIn).toHaveBeenCalledTimes(1);
      });
  });
});