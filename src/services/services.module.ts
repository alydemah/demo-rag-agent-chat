import { Module } from '@nestjs/common';
import { MockApiService } from './mock-api.service.js';

@Module({
  providers: [MockApiService],
  exports: [MockApiService],
})
export class ServicesModule {}
