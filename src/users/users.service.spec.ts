// src/users/users.service.spec.ts (Final Attempt - Using Jest.mock())
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ✅ Import the standard library name, which Jest will replace with our mock
import * as bcrypt from 'bcrypt'; 

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

// ⚠️ Add this line to explicitly tell Jest to use the manual mock found in __mocks__/bcrypt.ts
jest.mock('bcrypt'); 


// --- Stable Mock Repository Definition ---
type MockRepository = {
  [P in keyof Repository<User>]?: jest.Mock<any>;
};

const mockUserRepositoryFactory = (): MockRepository => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});
// --- End Mock Definition ---

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository; 

  const mockUser: User = { 
    id: 'uuid-123', 
    email: 'test@admin.com', 
    password: 'hashedpassword', 
    role: 'user', 
    createdAt: new Date(), 
    updatedAt: new Date() 
  };
  const mockCreateUserDto: CreateUserDto = { email: 'new@user.com', password: 'newpassword' };

  beforeEach(async () => {
    // Clear mocks on the 'bcrypt' object so calls are reset before each test
    (bcrypt.hash as jest.Mock).mockClear();
    (bcrypt.genSalt as jest.Mock).mockClear();
    
    // NOTE: If you need to set specific return values for a test, you must do it here:
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('mockSalt');
    // Note: hash is auto-set to 'mockHashedPassword' in __mocks__/bcrypt.ts, but can be overridden here if needed.
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepositoryFactory(), 
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- CREATE TESTS ---
  describe('create', () => {
    it('should successfully create a new user and hash the password', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);
      
      const result = await service.create(mockCreateUserDto);
      
      expect(result).toEqual(mockUser);
      expect(userRepository.save).toHaveBeenCalled();
      
      // ✅ Asserting against the mocked function on the 'bcrypt' object
      expect(bcrypt.hash as jest.Mock).toHaveBeenCalledWith(
        mockCreateUserDto.password, 
        'mockSalt' 
      );
    });

    it('should throw ConflictException if user email already exists', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  // --- FINDONE & FINDALL TESTS ---
  describe('findOne', () => {
    it('should find a user by ID', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockResolvedValue(mockUser);
      await expect(service.findOne(mockUser.id)).resolves.toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockRejectedValue(new Error());
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const usersArray: User[] = [mockUser];
      (userRepository.find as jest.Mock).mockResolvedValue(usersArray);
      await expect(service.findAll()).resolves.toEqual(usersArray);
    });
  });

  // --- UPDATE TESTS (Authorization Logic) ---
  describe('update (Authorization)', () => {
    const updateDto = { email: 'updated@email.com' };

    it('should allow user to update their own profile (Ownership)', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.update(
        mockUser.id, 
        updateDto, 
        mockUser.id, 
        'user'       
      );
      expect(result.email).toBe('updated@email.com');
    });

    it('should allow admin to update another user profile (Admin Privilege)', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.update(
        mockUser.id, 
        updateDto, 
        'different-user-id', 
        'admin'
      );
      expect(result.email).toBe('updated@email.com');
    });

    it('should throw ForbiddenException if regular user tries to update another profile', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.update(
        'another-id', 
        updateDto, 
        mockUser.id, 
        'user'
      )).rejects.toThrow(ForbiddenException);
    });

    it('should hash password if included in DTO', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({ ...mockUser, password: 'mockHashedPassword' }); 
      const updatePwdDto = { password: 'newpassword' };

      await service.update(mockUser.id, updatePwdDto, mockUser.id, 'user');
      
      // ✅ Asserting against the mocked function on the 'bcrypt' object
      expect(bcrypt.hash as jest.Mock).toHaveBeenCalledWith('newpassword', 'mockSalt');
    });
  });

  // --- REMOVE TESTS (Authorization Logic) ---
  describe('remove (Authorization)', () => {
    it('should allow admin to remove any user', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.remove as jest.Mock).mockResolvedValue(undefined);

      await service.remove(mockUser.id, 'admin-id', 'admin');
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should allow user to remove their own profile', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.remove as jest.Mock).mockResolvedValue(undefined);

      await service.remove(mockUser.id, mockUser.id, 'user');
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw ForbiddenException if regular user tries to remove another profile', async () => {
      (userRepository.findOneOrFail as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.remove(
        'another-id', 
        mockUser.id, 
        'user'
      )).rejects.toThrow(ForbiddenException);
    });
  });
});