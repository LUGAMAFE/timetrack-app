import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request: any, rawJwtToken: string, done: any) => {
        // Supabase uses JWKS, but for simplicity we use the JWT secret
        // In production, you might want to verify against Supabase's JWKS endpoint
        const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');
        if (!jwtSecret) {
          return done(new Error('JWT secret not configured'), null);
        }
        done(null, jwtSecret);
      },
      issuer: `${supabaseUrl}/auth/v1`,
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      this.logger.warn('Invalid JWT payload: missing sub');
      throw new UnauthorizedException('Invalid token');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
