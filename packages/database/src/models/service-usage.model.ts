import mongoose, { Schema } from 'mongoose';

export type ServiceUsageStatus = 'success' | 'failed';

export interface ServiceUsageMetadata {
  [key: string]: unknown;
}

export interface ServiceUsageRecord {
  id: string;
  service: string;
  provider: string;
  operation: string;
  model?: string;
  status: ServiceUsageStatus;
  usageCount: number;
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  errorMessage?: string;
  metadata?: ServiceUsageMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceUsageInput {
  service: string;
  provider: string;
  operation: string;
  model?: string;
  status: ServiceUsageStatus;
  usageCount?: number;
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  errorMessage?: string;
  metadata?: ServiceUsageMetadata;
}

export interface IServiceUsageDocument extends Omit<mongoose.Document, 'model'> {
  service: string;
  provider: string;
  operation: string;
  model?: string;
  status: ServiceUsageStatus;
  usageCount: number;
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  errorMessage?: string;
  metadata?: ServiceUsageMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const serviceUsageSchema = new Schema<IServiceUsageDocument>(
  {
    service: { type: String, required: true, index: true },
    provider: { type: String, required: true, index: true },
    operation: { type: String, required: true, index: true },
    model: { type: String },
    status: { type: String, enum: ['success', 'failed'], required: true, index: true },
    usageCount: { type: Number, default: 1 },
    durationMs: { type: Number },
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    totalTokens: { type: Number },
    estimatedCostUsd: { type: Number },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

serviceUsageSchema.index({ createdAt: -1 });
serviceUsageSchema.index({ service: 1, provider: 1, createdAt: -1 });
serviceUsageSchema.index({ status: 1, createdAt: -1 });

export const ServiceUsageModel = mongoose.model<IServiceUsageDocument>(
  'ServiceUsage',
  serviceUsageSchema
);

export function toServiceUsageRecord(doc: IServiceUsageDocument): ServiceUsageRecord {
  return {
    id: doc._id.toString(),
    service: doc.service,
    provider: doc.provider,
    operation: doc.operation,
    model: doc.model,
    status: doc.status,
    usageCount: doc.usageCount,
    durationMs: doc.durationMs,
    promptTokens: doc.promptTokens,
    completionTokens: doc.completionTokens,
    totalTokens: doc.totalTokens,
    estimatedCostUsd: doc.estimatedCostUsd,
    errorMessage: doc.errorMessage,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
