import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  // 1. Define a Mock for the UsersService
  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        // 2. Provide the Mock Service
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService); // Keep this line for potential spying/assertion later
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Example test for a controller method
  it('should call findAll on the service', async () => {
    await controller.findAll();
    expect(mockUsersService.findAll).toHaveBeenCalled();
  });
});