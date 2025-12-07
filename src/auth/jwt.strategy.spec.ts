import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string; 
  email: string;
  role: string;
}

const mockUsersService = {
  findOne: jest.fn(),
};

describe('JwtStrategy', () => { 
  let strategy: JwtStrategy;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => { 
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockUser: User = { 
        id: 'user-1', 
        email: 'test@user.com', 
        password: 'any-hash', 
        role: 'user', 
        createdAt: new Date(), 
        updatedAt: new Date() 
    };
    const payload: JwtPayload = { sub: 'user-1', email: 'test@user.com', role: 'user' };

    it('should successfully return the user payload if the user exists', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      const result = await strategy.validate(payload); 
      
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({ 
          id: mockUser.id, 
          email: mockUser.email, 
          role: mockUser.role 
      });
    });

    it('should throw UnauthorizedException if UsersService fails to find the user', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null); 

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException if the payload contains no user ID (sub)', async () => { 
        const badPayload = { sub: null, email: 'test@user.com', role: 'user' } as any;

        await expect(strategy.validate(badPayload)).rejects.toThrow(
            UnauthorizedException,
        );
        expect(usersService.findOne).not.toHaveBeenCalled();
    });
  });
});