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
  Request 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users') 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // CREATE - PUBLIC REGISTRATION
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // READ ALL - Requires Admin Role
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // READ ONE - Requires Authentication
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // UPDATE - Requires Authentication
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto,
    @Request() req 
  ) {
    return this.usersService.update(
      id, 
      updateUserDto, 
      req.user.userId, 
      req.user.role
    );
  }

  // DELETE - Requires Authentication
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK) 
  async remove(
    @Param('id') id: string,
    @Request() req 
  ) {
    await this.usersService.remove(id, req.user.userId, req.user.role);
    
    return { 
        message: `User with ID ${id} deleted successfully.`,
        statusCode: HttpStatus.OK
    };
  }
}