import { logger } from '@owl-mentors/utils';
import {
  CreateServiceUsageInput,
  ServiceUsageModel,
  ServiceUsageRecord,
  ServiceUsageStatus,
  toServiceUsageRecord,
} from '../models/service-usage.model';

export interface ListServiceUsageInput {
  service?: string;
  provider?: string;
  status?: ServiceUsageStatus;
  since?: Date;
}

export interface ServiceUsageOverview {
  totalCalls: number;
  totalUsage: number;
  successCount: number;
  failureCount: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  averageDurationMs: number;
  totalEstimatedCostUsd: number;
  uniqueServices: number;
}

export interface ServiceUsageGroupSummary {
  service: string;
  provider: string;
  totalCalls: number;
  totalUsage: number;
  successCount: number;
  failureCount: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  averageDurationMs: number;
  totalEstimatedCostUsd: number;
  lastUsedAt?: Date;
  operations: string[];
}

function buildFilter(filters: ListServiceUsageInput) {
  const filter: Record<string, unknown> = {};

  if (filters.service) filter.service = filters.service;
  if (filters.provider) filter.provider = filters.provider;
  if (filters.status) filter.status = filters.status;
  if (filters.since) filter.createdAt = { $gte: filters.since };

  return filter;
}

export class ServiceUsageRepository {
  async create(data: CreateServiceUsageInput): Promise<ServiceUsageRecord> {
    const startTime = Date.now();

    try {
      const doc = await ServiceUsageModel.create({
        ...data,
        usageCount: data.usageCount ?? 1,
      });

      logger.db({ operation: 'insert', collection: 'service_usage', duration: Date.now() - startTime });
      return toServiceUsageRecord(doc);
    } catch (error) {
      logger.db({
        operation: 'insert',
        collection: 'service_usage',
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async list(
    filters: ListServiceUsageInput,
    limit = 25,
    offset = 0
  ): Promise<{ records: ServiceUsageRecord[]; total: number }> {
    const startTime = Date.now();

    try {
      const query = buildFilter(filters);
      const [docs, total] = await Promise.all([
        ServiceUsageModel.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit),
        ServiceUsageModel.countDocuments(query),
      ]);

      logger.db({ operation: 'find', collection: 'service_usage', duration: Date.now() - startTime });
      return {
        records: docs.map(toServiceUsageRecord),
        total,
      };
    } catch (error) {
      logger.db({
        operation: 'find',
        collection: 'service_usage',
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getOverview(filters: ListServiceUsageInput): Promise<ServiceUsageOverview> {
    const startTime = Date.now();

    try {
      const match = buildFilter(filters);
      const [summary] = await ServiceUsageModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            totalUsage: { $sum: '$usageCount' },
            successCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
              },
            },
            failureCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
              },
            },
            totalTokens: { $sum: { $ifNull: ['$totalTokens', 0] } },
            promptTokens: { $sum: { $ifNull: ['$promptTokens', 0] } },
            completionTokens: { $sum: { $ifNull: ['$completionTokens', 0] } },
            averageDurationMs: { $avg: { $ifNull: ['$durationMs', 0] } },
            totalEstimatedCostUsd: { $sum: { $ifNull: ['$estimatedCostUsd', 0] } },
            uniqueServices: {
              $addToSet: {
                service: '$service',
                provider: '$provider',
              },
            },
          },
        },
      ]);

      logger.db({ operation: 'aggregate', collection: 'service_usage', duration: Date.now() - startTime });

      return {
        totalCalls: summary?.totalCalls ?? 0,
        totalUsage: summary?.totalUsage ?? 0,
        successCount: summary?.successCount ?? 0,
        failureCount: summary?.failureCount ?? 0,
        totalTokens: summary?.totalTokens ?? 0,
        promptTokens: summary?.promptTokens ?? 0,
        completionTokens: summary?.completionTokens ?? 0,
        averageDurationMs: summary?.averageDurationMs ?? 0,
        totalEstimatedCostUsd: summary?.totalEstimatedCostUsd ?? 0,
        uniqueServices: Array.isArray(summary?.uniqueServices) ? summary.uniqueServices.length : 0,
      };
    } catch (error) {
      logger.db({
        operation: 'aggregate',
        collection: 'service_usage',
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getServiceBreakdown(filters: ListServiceUsageInput): Promise<ServiceUsageGroupSummary[]> {
    const startTime = Date.now();

    try {
      const match = buildFilter(filters);
      const results = await ServiceUsageModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              service: '$service',
              provider: '$provider',
            },
            totalCalls: { $sum: 1 },
            totalUsage: { $sum: '$usageCount' },
            successCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
              },
            },
            failureCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
              },
            },
            totalTokens: { $sum: { $ifNull: ['$totalTokens', 0] } },
            promptTokens: { $sum: { $ifNull: ['$promptTokens', 0] } },
            completionTokens: { $sum: { $ifNull: ['$completionTokens', 0] } },
            averageDurationMs: { $avg: { $ifNull: ['$durationMs', 0] } },
            totalEstimatedCostUsd: { $sum: { $ifNull: ['$estimatedCostUsd', 0] } },
            lastUsedAt: { $max: '$createdAt' },
            operations: { $addToSet: '$operation' },
          },
        },
        { $sort: { totalCalls: -1, lastUsedAt: -1 } },
      ]);

      logger.db({ operation: 'aggregate', collection: 'service_usage', duration: Date.now() - startTime });

      return results.map(result => ({
        service: result._id.service,
        provider: result._id.provider,
        totalCalls: result.totalCalls ?? 0,
        totalUsage: result.totalUsage ?? 0,
        successCount: result.successCount ?? 0,
        failureCount: result.failureCount ?? 0,
        totalTokens: result.totalTokens ?? 0,
        promptTokens: result.promptTokens ?? 0,
        completionTokens: result.completionTokens ?? 0,
        averageDurationMs: result.averageDurationMs ?? 0,
        totalEstimatedCostUsd: result.totalEstimatedCostUsd ?? 0,
        lastUsedAt: result.lastUsedAt,
        operations: result.operations ?? [],
      }));
    } catch (error) {
      logger.db({
        operation: 'aggregate',
        collection: 'service_usage',
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
