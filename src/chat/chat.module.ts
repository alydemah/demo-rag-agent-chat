import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module.js';
import { ServicesModule } from '../services/services.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [RagModule, ServicesModule],
  controllers: [ChatController],
  providers: [ChatService, SessionService],
  exports: [ChatService],
})
export class ChatModule {}
