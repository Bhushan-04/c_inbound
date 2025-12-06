import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), 
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    // req.user is populated by JwtStrategy
    const { user } = context.switchToHttp().getRequest();

    // Check if the user's role matches any of the required roles
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}