import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from '../users/users.service'; 

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
            secretOrKey: 'YOUR_SECRET_KEY', 
        });
    }

    async validate(payload: JwtPayload): Promise<any> {
        if (!payload.sub) {
            throw new UnauthorizedException('Invalid token payload: Missing subject (sub).');
        }
        
        const user = await this.usersService.findOne(payload.sub); 

        if (!user) {
            throw new UnauthorizedException();
        }

        return { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
        };
    }
}