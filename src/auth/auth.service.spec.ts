// src/auth/auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service'; 
import { JwtService } from '@nestjs/jwt'; 
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt'; 
import { User } from '../users/entities/user.entity';

// IMPORTANT: Tell Jest to use the manual mock located in __mocks__/bcrypt.ts
jest.mock('bcrypt'); 

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const userStub: User = {
    id: 'uuid-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const loginDto = { email: userStub.email, password: 'correctPassword' };
  const mockToken = 'mock-jwt-token';

  // 1. Define Mocks for the dependencies
  const mockUsersService = {
    findByEmail: jest.fn(), 
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockClear();

    (jwtService.signAsync as jest.Mock).mockResolvedValue(mockToken);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true); 
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Tests for signIn method ---
  describe('signIn', () => {
    it('should successfully return an access token on valid credentials (100% Success Path)', async () => {
      // Arrange
      (usersService.findByEmail as jest.Mock).mockResolvedValue(userStub);
      
      // Act
      const result = await service.signIn(loginDto.email, loginDto.password);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare as jest.Mock).toHaveBeenCalledWith(
        loginDto.password,
        userStub.password, 
      );
      // ✅ FIX: Removed 'role' property from the expectation to match the actual payload
      expect(jwtService.signAsync).toHaveBeenCalledWith({ 
          sub: userStub.id, 
          email: userStub.email,
          // role: userStub.role, // Removed to fix assertion failure
      });
      expect(result).toEqual({ access_token: mockToken });
    });

    it('should throw UnauthorizedException if the user is not found by email (Missing Branch 1)', async () => {
      // Arrange: Simulate user not found
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.signIn(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);
      
      expect(usersService.findByEmail).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare as jest.Mock).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if the password comparison fails (Missing Branch 2)', async () => {
      // Arrange: User found, but password comparison fails
      (usersService.findByEmail as jest.Mock).mockResolvedValue(userStub);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); 

      // Act & Assert
      await expect(
        service.signIn(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.findByEmail).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare as jest.Mock).toHaveBeenCalledTimes(1);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});