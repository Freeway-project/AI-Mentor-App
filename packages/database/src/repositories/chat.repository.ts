import { Collection, ObjectId } from 'mongodb';
import { Conversation, Message, CreateConversationInput, SendMessageInput, ListMessagesInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { getDatabase } from '../connection';
import { ConversationDocument, MessageDocument, toConversation, toMessage } from '../models/chat.model';

export class ChatRepository {
  private conversationCollection: Collection<ConversationDocument>;
  private messageCollection: Collection<MessageDocument>;

  constructor() {
    const db = getDatabase();
    this.conversationCollection = db.collection<ConversationDocument>('conversations');
    this.messageCollection = db.collection<MessageDocument>('messages');
  }

  async createConversation(menteeId: string, data: CreateConversationInput): Promise<Conversation> {
    const startTime = Date.now();
    try {
      const doc: Partial<ConversationDocument> = {
        menteeId: new ObjectId(menteeId),
        mentorId: new ObjectId(data.mentorId),
        meetingId: data.meetingId ? new ObjectId(data.meetingId) : undefined,
        unreadCount: { mentee: 0, mentor: 0 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.conversationCollection.insertOne(doc as ConversationDocument);
      logger.db({ operation: 'insert', collection: 'conversations', duration: Date.now() - startTime });

      return this.findConversationById(result.insertedId.toString());
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'conversations', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findConversationById(id: string): Promise<Conversation> {
    const startTime = Date.now();
    try {
      const doc = await this.conversationCollection.findOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'findOne', collection: 'conversations', duration: Date.now() - startTime });

      if (!doc) {
        throw new Error('Conversation not found');
      }

      return toConversation(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'conversations', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const startTime = Date.now();
    try {
      const docs = await this.conversationCollection
        .find({
          $or: [
            { menteeId: new ObjectId(userId) },
            { mentorId: new ObjectId(userId) },
          ],
          isActive: true,
        })
        .sort({ lastMessageAt: -1 })
        .toArray();

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
      const doc: Partial<MessageDocument> = {
        conversationId: new ObjectId(data.conversationId),
        senderId: new ObjectId(senderId),
        senderRole,
        type: data.type,
        content: data.content,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        readBy: [new ObjectId(senderId)],
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.messageCollection.insertOne(doc as MessageDocument);

      await this.conversationCollection.updateOne(
        { _id: new ObjectId(data.conversationId) },
        {
          $set: { lastMessageAt: new Date(), updatedAt: new Date() },
          $inc: senderRole === 'mentee' ? { 'unreadCount.mentor': 1 } : { 'unreadCount.mentee': 1 }
        }
      );

      logger.db({ operation: 'insert', collection: 'messages', duration: Date.now() - startTime });

      return this.findMessageById(result.insertedId.toString());
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'messages', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findMessageById(id: string): Promise<Message> {
    const startTime = Date.now();
    try {
      const doc = await this.messageCollection.findOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'findOne', collection: 'messages', duration: Date.now() - startTime });

      if (!doc) {
        throw new Error('Message not found');
      }

      return toMessage(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'messages', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async listMessages(params: ListMessagesInput): Promise<Message[]> {
    const startTime = Date.now();
    try {
      const filter: any = {
        conversationId: new ObjectId(params.conversationId),
      };

      if (params.before) {
        filter.createdAt = { $lt: new Date(params.before) };
      }

      const docs = await this.messageCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(params.limit || 50)
        .toArray();

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
      await this.messageCollection.updateMany(
        {
          conversationId: new ObjectId(conversationId),
          readBy: { $ne: new ObjectId(userId) },
        },
        { $addToSet: { readBy: new ObjectId(userId) } }
      );

      const conversation = await this.conversationCollection.findOne({ _id: new ObjectId(conversationId) });
      if (conversation) {
        const isMentee = conversation.menteeId.toString() === userId;
        await this.conversationCollection.updateOne(
          { _id: new ObjectId(conversationId) },
          { $set: isMentee ? { 'unreadCount.mentee': 0 } : { 'unreadCount.mentor': 0 } }
        );
      }

      logger.db({ operation: 'updateMany', collection: 'messages', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'updateMany', collection: 'messages', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
