import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BufferWindowMemory } from '@langchain/classic/memory';

export interface Session {
  sessionId: string;
  memory: BufferWindowMemory;
}

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, BufferWindowMemory>();

  getOrCreateSession(sessionId?: string): Session {
    const id = sessionId || randomUUID();

    if (!this.sessions.has(id)) {
      this.sessions.set(
        id,
        new BufferWindowMemory({ k: 10, returnMessages: true, memoryKey: 'chat_history', inputKey: 'input', outputKey: 'output' }),
      );
    }

    return { sessionId: id, memory: this.sessions.get(id)! };
  }

  clearSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
