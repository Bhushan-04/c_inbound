import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignInDto } from '../users/dto/sign-in.dto';

const mockAuthService = {
  //mock the signIn method
  signIn: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService, 
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  //signIn (POST /auth/login)
  describe('signIn', () => {
    const signInDto: SignInDto = { 
        email: 'test@user.com', 
        password: 'password123' 
    };
    const mockAccessToken = { access_token: 'mock-jwt-token' };

    it('should call authService.signIn and return an access token on successful login (200 OK)', async () => {
      (authService.signIn as jest.Mock).mockResolvedValue(mockAccessToken);

      const result = await controller.signIn(signInDto);

      expect(authService.signIn).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(result).toEqual(mockAccessToken);
    });

    it('should pass the UnauthorizedException from the service up to the handler', async () => {
      (authService.signIn as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.signIn).toHaveBeenCalledTimes(1);
    });

    it('should handle other unexpected errors from the service', async () => {
        (authService.signIn as jest.Mock).mockRejectedValue(
          new Error('Database connection failed'),
        );
  
        await expect(controller.signIn(signInDto)).rejects.toThrow('Database connection failed');
        expect(authService.signIn).toHaveBeenCalledTimes(1);
      });
  });
});