import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Request // Used to access the authenticated user (req.user)
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// --- Authorization Imports ---
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
// ---

@Controller('users') 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. CREATE (C) - PUBLIC REGISTRATION
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // --- PROTECTED ENDPOINTS (RUD) ---

  // 2. READ ALL (R) - Requires Admin Role
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 3. READ ONE (R) - Requires Authentication
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 4. UPDATE (U) - Requires Authentication (Ownership enforced in service)
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto,
    @Request() req // Inject the request to get req.user.userId/role
  ) {
    // Pass target ID, update data, and the authenticated user's ID/role to the service
    return this.usersService.update(
      id, 
      updateUserDto, 
      req.user.userId, 
      req.user.role
    );
  }

  // 5. DELETE (D) - Requires Authentication (Authorization enforced in service)
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK) 
  async remove(
    @Param('id') id: string,
    @Request() req // Inject the request to get req.user.userId/role
  ) {
    // Pass target ID, and the authenticated user's ID/role to the service
    await this.usersService.remove(id, req.user.userId, req.user.role);
    
    return { 
        message: `User with ID ${id} deleted successfully.`,
        statusCode: HttpStatus.OK
    };
  }
}