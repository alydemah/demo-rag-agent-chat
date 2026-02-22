import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { LlmModule } from './llm/llm.module.js';
import { ChatModule } from './chat/chat.module.js';
import { RagModule } from './rag/rag.module.js';
import { ServicesModule } from './services/services.module.js';
import { UploadModule } from './upload/upload.module.js';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    LlmModule,
    ServicesModule,
    RagModule,
    ChatModule,
    UploadModule,
  ],
})
export class AppModule {}
