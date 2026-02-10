import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const jwksUri = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: jwksUri,
      }),
      algorithms: ['ES256', 'RS256'],
    });
    
    this.logger.log(`JWT Strategy initialized with JWKS from: ${jwksUri}`);
  }

  async validate(payload: any) {
    this.logger.log(`Validating JWT payload for user: ${payload?.sub}`);
    
    if (!payload?.sub) {
      this.logger.warn('Invalid JWT payload: missing sub');
      throw new UnauthorizedException('Invalid token');
    }
    
    this.logger.log(`JWT validated for user: ${payload.sub}`);
    return { userId: payload.sub, email: payload?.email };
  }
}
