import { z } from 'zod';

export const ChatResponseSchema = z.object({
  answer: z.string(),
  sessionId: z.string(),
  sources: z.array(z.string()).optional(),
  toolsUsed: z.array(z.string()).optional(),
  timestamp: z.string(),
});

export type ChatResponseDto = z.infer<typeof ChatResponseSchema>;
