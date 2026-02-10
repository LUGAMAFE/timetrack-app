import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET') || 'fallback-secret';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    this.logger.log(`JWT Strategy initialized, secret length: ${jwtSecret?.length ?? 0}`);
  }

  async validate(payload: any) {
    this.logger.log(`Validating JWT payload: ${JSON.stringify(payload)}`);
    
    if (!payload?.sub) {
      this.logger.warn('Invalid JWT payload: missing sub');
      throw new UnauthorizedException('Invalid token');
    }
    
    this.logger.log(`JWT validated for user: ${payload.sub}`);
    return { userId: payload.sub, email: payload?.email };
  }
}
