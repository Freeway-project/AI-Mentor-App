import { ObjectId } from 'mongodb';
import { Conversation, Message } from '@owl-mentors/types';

export interface ConversationDocument extends Omit<Conversation, 'id' | 'learnerId' | 'providerId' | 'meetingId' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  learnerId: ObjectId;
  providerId: ObjectId;
  meetingId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDocument extends Omit<Message, 'id' | 'conversationId' | 'senderId' | 'readBy' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
  readBy: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export function toConversation(doc: ConversationDocument): Conversation {
  return {
    id: doc._id.toString(),
    learnerId: doc.learnerId.toString(),
    providerId: doc.providerId.toString(),
    meetingId: doc.meetingId?.toString(),
    lastMessageAt: doc.lastMessageAt,
    unreadCount: doc.unreadCount,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toMessage(doc: MessageDocument): Message {
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

export function toConversationDocument(conversation: Partial<Conversation>): Partial<ConversationDocument> {
  const doc: any = { ...conversation };

  if (conversation.id) {
    doc._id = new ObjectId(conversation.id);
    delete doc.id;
  }

  if (conversation.learnerId) {
    doc.learnerId = new ObjectId(conversation.learnerId);
  }

  if (conversation.providerId) {
    doc.providerId = new ObjectId(conversation.providerId);
  }

  if (conversation.meetingId) {
    doc.meetingId = new ObjectId(conversation.meetingId);
  }

  return doc;
}

export function toMessageDocument(message: Partial<Message>): Partial<MessageDocument> {
  const doc: any = { ...message };

  if (message.id) {
    doc._id = new ObjectId(message.id);
    delete doc.id;
  }

  if (message.conversationId) {
    doc.conversationId = new ObjectId(message.conversationId);
  }

  if (message.senderId) {
    doc.senderId = new ObjectId(message.senderId);
  }

  if (message.readBy) {
    doc.readBy = message.readBy.map((id) => new ObjectId(id));
  }

  return doc;
}
