import mongoose, { Schema } from 'mongoose';
import { Topic } from '@owl-mentors/types';

export interface ITopicDocument extends mongoose.Document {
  name: string;
  slug: string;
  description?: string;
  category: string;
  isActive: boolean;
  mentorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopicDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    mentorCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topicSchema.index({ category: 1 });
topicSchema.index({ isActive: 1 });

export const TopicModel = mongoose.model<ITopicDocument>('Topic', topicSchema);

export function toTopic(doc: ITopicDocument): Topic {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    category: doc.category,
    isActive: doc.isActive,
    mentorCount: doc.mentorCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Legacy compat
export type TopicDocument = ITopicDocument;
