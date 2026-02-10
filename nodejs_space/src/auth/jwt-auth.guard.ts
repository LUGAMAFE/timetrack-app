import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    this.logger.log(`Auth header present: ${!!authHeader}, starts with Bearer: ${authHeader?.startsWith('Bearer ')}`);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    this.logger.log(`handleRequest - err: ${err?.message}, user: ${!!user}, info: ${info?.message || info}`);
    if (err || !user) {
      this.logger.error(`Auth failed: ${err?.message || info?.message || 'Unknown error'}`);
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
