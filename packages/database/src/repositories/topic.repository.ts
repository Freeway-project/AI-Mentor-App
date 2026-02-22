import { Topic, CreateTopicInput, UpdateTopicInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { TopicModel, toTopic } from '../models/topic.model';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export class TopicRepository {
  async create(data: CreateTopicInput): Promise<Topic> {
    const startTime = Date.now();
    try {
      const doc = await TopicModel.create({
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description,
        category: data.category,
        isActive: true,
        mentorCount: 0,
      });
      logger.db({ operation: 'insert', collection: 'topics', duration: Date.now() - startTime });
      return toTopic(doc);
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'topics', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Topic | null> {
    const startTime = Date.now();
    try {
      const doc = await TopicModel.findById(id);
      logger.db({ operation: 'findOne', collection: 'topics', duration: Date.now() - startTime });
      return doc ? toTopic(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'topics', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<Topic | null> {
    const startTime = Date.now();
    try {
      const doc = await TopicModel.findOne({ slug });
      logger.db({ operation: 'findOne', collection: 'topics', duration: Date.now() - startTime });
      return doc ? toTopic(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'topics', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findAll(filter: { category?: string; isActive?: boolean } = {}, limit = 20, offset = 0): Promise<{ topics: Topic[]; total: number }> {
    const startTime = Date.now();
    try {
      const query: any = {};
      if (filter.category) query.category = filter.category;
      if (filter.isActive !== undefined) query.isActive = filter.isActive;

      const [docs, total] = await Promise.all([
        TopicModel.find(query).sort({ name: 1 }).skip(offset).limit(limit),
        TopicModel.countDocuments(query),
      ]);
      logger.db({ operation: 'find', collection: 'topics', duration: Date.now() - startTime });
      return { topics: docs.map(toTopic), total };
    } catch (error) {
      logger.db({ operation: 'find', collection: 'topics', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async update(id: string, data: UpdateTopicInput): Promise<Topic | null> {
    const startTime = Date.now();
    try {
      const updateData: any = { ...data };
      if (data.name) updateData.slug = generateSlug(data.name);

      const doc = await TopicModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      logger.db({ operation: 'update', collection: 'topics', duration: Date.now() - startTime });
      return doc ? toTopic(doc) : null;
    } catch (error) {
      logger.db({ operation: 'update', collection: 'topics', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async incrementMentorCount(id: string): Promise<void> {
    const startTime = Date.now();
    try {
      await TopicModel.findByIdAndUpdate(id, { $inc: { mentorCount: 1 } });
      logger.db({ operation: 'update', collection: 'topics', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'topics', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async decrementMentorCount(id: string): Promise<void> {
    const startTime = Date.now();
    try {
      await TopicModel.findOneAndUpdate({ _id: id, mentorCount: { $gt: 0 } }, { $inc: { mentorCount: -1 } });
      logger.db({ operation: 'update', collection: 'topics', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'topics', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findDistinctCategories(): Promise<string[]> {
    const startTime = Date.now();
    try {
      const categories = await TopicModel.distinct('category', { isActive: true });
      logger.db({ operation: 'distinct', collection: 'topics', duration: Date.now() - startTime });
      return categories;
    } catch (error) {
      logger.db({ operation: 'distinct', collection: 'topics', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
