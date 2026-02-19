import { z } from 'zod';

export const messageTypeEnum = z.enum(['text', 'file', 'system']);

export const conversationSchema = z.object({
  id: z.string(),
  menteeId: z.string(),
  mentorId: z.string(),
  meetingId: z.string().optional(),
  lastMessageAt: z.date().optional(),
  unreadCount: z.object({
    mentee: z.number().int().nonnegative().default(0),
    mentor: z.number().int().nonnegative().default(0),
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  senderRole: z.enum(['mentee', 'mentor', 'system']),
  type: messageTypeEnum,
  content: z.string().max(5000),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  readBy: z.array(z.string()).default([]),
  isEdited: z.boolean().default(false),
  editedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Conversation = z.infer<typeof conversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type MessageType = z.infer<typeof messageTypeEnum>;

export const createConversationSchema = z.object({
  mentorId: z.string(),
  meetingId: z.string().optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(5000),
  type: messageTypeEnum.default('text'),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const listMessagesSchema = z.object({
  conversationId: z.string(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  before: z.string().datetime().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type ListMessagesInput = z.infer<typeof listMessagesSchema>;
