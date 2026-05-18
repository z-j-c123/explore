import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  imports: [UploadModule],
  controllers: [ShopsController],
  providers: [ShopsService],
})
export class ShopsModule {}
