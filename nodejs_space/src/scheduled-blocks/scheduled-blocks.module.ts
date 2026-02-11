import { Module } from '@nestjs/common';
import { ScheduledBlocksController } from './scheduled-blocks.controller';
import { ScheduledBlocksService } from './scheduled-blocks.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ScheduledBlocksController],
  providers: [ScheduledBlocksService],
  exports: [ScheduledBlocksService],
})
export class ScheduledBlocksModule {}
