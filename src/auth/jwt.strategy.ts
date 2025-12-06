// src/auth/jwt.strategy.ts

import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, ExtractJwt } from 'passport-jwt';
// ⚠️ Using relative path to fix module resolution error
import { UsersService } from '../users/users.service'; 

// Define the payload structure expected from the token
interface JwtPayload {
    sub: string; 
    email: string;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // NOTE: Replace 'YOUR_SECRET_KEY' with process.env.JWT_SECRET or a config service call
            secretOrKey: 'YOUR_SECRET_KEY', 
        });
    }

    async validate(payload: JwtPayload): Promise<any> {
        // ✅ FIX: Immediately reject invalid payloads before attempting a database query
        if (!payload.sub) {
            throw new UnauthorizedException('Invalid token payload: Missing subject (sub).');
        }
        
        // Find the user by ID
        const user = await this.usersService.findOne(payload.sub); 

        if (!user) {
            // If the user doesn't exist (e.g., deleted), unauthorized
            throw new UnauthorizedException();
        }

        // Return a subset of the user data to be added to the request (req.user)
        return { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
        };
    }
}