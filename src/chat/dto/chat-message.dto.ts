import { z } from 'zod';

export const ChatMessageSchema = z.object({
  message: z.string().min(1, 'Message must not be empty'),
  sessionId: z.string().optional(),
});

export type ChatMessageDto = z.infer<typeof ChatMessageSchema>;
