import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { GoalsModule } from '../goals/goals.module';
import { ValidationsModule } from '../validations/validations.module';
import { RulesModule } from '../rules/rules.module';

@Module({
  imports: [SupabaseModule, GoalsModule, ValidationsModule, RulesModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
