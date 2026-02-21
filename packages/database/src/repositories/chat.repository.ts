import mongoose from 'mongoose';
import { Conversation, Message, CreateConversationInput, SendMessageInput, ListMessagesInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { ConversationModel, MessageModel, toConversation, toMessage } from '../models/chat.model';

export class ChatRepository {
  async createConversation(menteeId: string, data: CreateConversationInput): Promise<Conversation> {
    const startTime = Date.now();
    try {
      const doc = await ConversationModel.create({
        menteeId: new mongoose.Types.ObjectId(menteeId),
        mentorId: new mongoose.Types.ObjectId(data.mentorId),
        meetingId: data.meetingId ? new mongoose.Types.ObjectId(data.meetingId) : undefined,
        unreadCount: { mentee: 0, mentor: 0 },
        isActive: true,
      });
      logger.db({ operation: 'insert', collection: 'conversations', duration: Date.now() - startTime });
      return toConversation(doc);
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'conversations', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findConversationById(id: string): Promise<Conversation> {
    const startTime = Date.now();
    try {
      const doc = await ConversationModel.findById(id);
      logger.db({ operation: 'findOne', collection: 'conversations', duration: Date.now() - startTime });
      if (!doc) throw new Error('Conversation not found');
      return toConversation(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'conversations', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const startTime = Date.now();
    try {
      const oid = new mongoose.Types.ObjectId(userId);
      const docs = await ConversationModel.find({
        $or: [{ menteeId: oid }, { mentorId: oid }],
        isActive: true,
      }).sort({ lastMessageAt: -1 });
      logger.db({ operation: 'find', collection: 'conversations', duration: Date.now() - startTime });
      return docs.map(toConversation);
    } catch (error) {
      logger.db({ operation: 'find', collection: 'conversations', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async sendMessage(senderId: string, senderRole: 'mentee' | 'mentor', data: SendMessageInput): Promise<Message> {
    const startTime = Date.now();
    try {
      const doc = await MessageModel.create({
        conversationId: new mongoose.Types.ObjectId(data.conversationId),
        senderId: new mongoose.Types.ObjectId(senderId),
        senderRole,
        type: data.type,
        content: data.content,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        readBy: [new mongoose.Types.ObjectId(senderId)],
        isEdited: false,
      });

      const unreadIncrement = senderRole === 'mentee' ? { 'unreadCount.mentor': 1 } : { 'unreadCount.mentee': 1 };
      await ConversationModel.findByIdAndUpdate(data.conversationId, {
        $set: { lastMessageAt: new Date() },
        $inc: unreadIncrement,
      });

      logger.db({ operation: 'insert', collection: 'messages', duration: Date.now() - startTime });
      return toMessage(doc);
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'messages', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findMessageById(id: string): Promise<Message> {
    const startTime = Date.now();
    try {
      const doc = await MessageModel.findById(id);
      logger.db({ operation: 'findOne', collection: 'messages', duration: Date.now() - startTime });
      if (!doc) throw new Error('Message not found');
      return toMessage(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'messages', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async listMessages(params: ListMessagesInput): Promise<Message[]> {
    const startTime = Date.now();
    try {
      const filter: any = { conversationId: new mongoose.Types.ObjectId(params.conversationId) };
      if (params.before) filter.createdAt = { $lt: new Date(params.before) };

      const docs = await MessageModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(params.limit || 50);

      logger.db({ operation: 'find', collection: 'messages', duration: Date.now() - startTime });
      return docs.map(toMessage).reverse();
    } catch (error) {
      logger.db({ operation: 'find', collection: 'messages', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      const oid = new mongoose.Types.ObjectId(userId);
      await MessageModel.updateMany(
        { conversationId: new mongoose.Types.ObjectId(conversationId), readBy: { $ne: oid } },
        { $addToSet: { readBy: oid } }
      );

      const conversation = await ConversationModel.findById(conversationId);
      if (conversation) {
        const isMentee = conversation.menteeId.toString() === userId;
        await ConversationModel.findByIdAndUpdate(conversationId, {
          $set: isMentee ? { 'unreadCount.mentee': 0 } : { 'unreadCount.mentor': 0 },
        });
      }
      logger.db({ operation: 'updateMany', collection: 'messages', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'updateMany', collection: 'messages', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
