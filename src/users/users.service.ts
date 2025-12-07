import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
        throw new ConflictException('User with this email already exists.');
    }
    
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    try {
        return await this.usersRepository.findOneOrFail({ where: { id } });
    } catch (e) {
        throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
  
  async findByEmail(email: string): Promise<User> {
    try {
        return await this.usersRepository.findOneOrFail({ where: { email } });
    } catch (e) {
        throw new NotFoundException(`User with email ${email} not found`);
    }
  }

  async update(
    targetId: string, 
    updateUserDto: UpdateUserDto,
    currentUserId: string, 
    currentUserRole: string
  ): Promise<User> {
    
    if (targetId !== currentUserId && currentUserRole !== 'admin') {
        throw new ForbiddenException('You are not authorized to update this user profile.');
    }

    const user = await this.findOne(targetId);

    if (updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    
    Object.assign(user, updateUserDto); 
    return this.usersRepository.save(user);
  }

  async remove(
    targetId: string, 
    currentUserId: string, 
    currentUserRole: string
  ): Promise<void> {

    if (targetId !== currentUserId && currentUserRole !== 'admin') {
        throw new ForbiddenException('You are not authorized to delete this user profile.');
    }
    
    const user = await this.findOne(targetId);
    await this.usersRepository.remove(user);
  }
}