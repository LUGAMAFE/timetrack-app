import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StreaksModule } from './streaks/streaks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    CategoriesModule,
    TimeEntriesModule,
    DashboardModule,
    StreaksModule,
  ],
})
export class AppModule {}
