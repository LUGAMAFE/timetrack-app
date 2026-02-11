import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StreaksModule } from './streaks/streaks.module';
import { ScheduledBlocksModule } from './scheduled-blocks/scheduled-blocks.module';
import { ValidationsModule } from './validations/validations.module';
import { GoalsModule } from './goals/goals.module';
import { TemplatesModule } from './templates/templates.module';
import { RulesModule } from './rules/rules.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    CategoriesModule,
    TimeEntriesModule,
    DashboardModule,
    StreaksModule,
    ScheduledBlocksModule,
    ValidationsModule,
    GoalsModule,
    TemplatesModule,
    RulesModule,
    AiModule,
  ],
})
export class AppModule {}
