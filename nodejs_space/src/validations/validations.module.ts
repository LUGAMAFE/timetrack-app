import { Module } from '@nestjs/common';
import { ValidationsController } from './validations.controller';
import { ValidationsService } from './validations.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ValidationsController],
  providers: [ValidationsService],
  exports: [ValidationsService],
})
export class ValidationsModule {}
