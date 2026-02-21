import mongoose, { Schema } from 'mongoose';
import { Conversation, Message } from '@owl-mentors/types';

export interface IConversationDocument extends mongoose.Document {
  menteeId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  meetingId?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  unreadCount: { mentee: number; mentor: number };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument extends mongoose.Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: 'mentee' | 'mentor' | 'system';
  type: 'text' | 'file' | 'system';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    menteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    lastMessageAt: { type: Date },
    unreadCount: {
      mentee: { type: Number, default: 0 },
      mentor: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

conversationSchema.index({ menteeId: 1 });
conversationSchema.index({ mentorId: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ menteeId: 1, mentorId: 1 }, { unique: true });

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['mentee', 'mentor', 'system'], required: true },
    type: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
    content: { type: String, required: true },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

export const ConversationModel = mongoose.model<IConversationDocument>('Conversation', conversationSchema);
export const MessageModel = mongoose.model<IMessageDocument>('Message', messageSchema);

export function toConversation(doc: IConversationDocument): Conversation {
  return {
    id: doc._id.toString(),
    menteeId: doc.menteeId.toString(),
    mentorId: doc.mentorId.toString(),
    meetingId: doc.meetingId?.toString(),
    lastMessageAt: doc.lastMessageAt,
    unreadCount: doc.unreadCount,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toMessage(doc: IMessageDocument): Message {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId.toString(),
    senderId: doc.senderId.toString(),
    senderRole: doc.senderRole,
    type: doc.type,
    content: doc.content,
    fileUrl: doc.fileUrl,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    readBy: doc.readBy.map((id) => id.toString()),
    isEdited: doc.isEdited,
    editedAt: doc.editedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Legacy compat
export type ConversationDocument = IConversationDocument;
export type MessageDocument = IMessageDocument;
export function toConversationDocument(c: any) { return c; }
export function toMessageDocument(m: any) { return m; }
