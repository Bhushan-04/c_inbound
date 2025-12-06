import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from '../users/dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Public endpoint for user login.
   * On success, returns a JWT access token.
   */
  @HttpCode(HttpStatus.OK) // Sets the success status code to 200 instead of default 201 (for POST)
  @Post('login')
  async signIn(@Body() signInDto: SignInDto) {
    // 1. DTO validation happens automatically thanks to the ValidationPipe in main.ts

    // 2. Call the service to validate credentials and generate token
    const result = await this.authService.signIn(
      signInDto.email,
      signInDto.password,
    );

    // 3. The service returns an object: { access_token: '...' }
    return result;
  }

  // NOTE: You can also add a /register endpoint here if you want to keep
  // user creation logic separate from the main UsersController.
}