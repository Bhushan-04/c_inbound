import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity'; // Import the User entity

@Module({
  imports: [
    // --- THIS IS THE CRITICAL LINE ---
    // It registers the User entity for this module, making the UserRepository available
    TypeOrmModule.forFeature([User]), 
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Important: export UsersService for use in AuthModule
})
export class UsersModule {}