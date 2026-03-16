import { ServiceUsageRepository, CreateServiceUsageInput } from '@owl-mentors/database';
import { logger } from '@owl-mentors/utils';

type ServiceUsageRecordInput = Omit<CreateServiceUsageInput, 'status'> & {
  status: 'success' | 'failed';
};

class ServiceUsageService {
  private repo: ServiceUsageRepository | null = null;

  private getRepo() {
    if (!this.repo) {
      this.repo = new ServiceUsageRepository();
    }

    return this.repo;
  }

  async record(data: ServiceUsageRecordInput): Promise<void> {
    try {
      await this.getRepo().create(data);
    } catch (error) {
      logger.warn('[ServiceUsage] Failed to persist usage record', {
        service: data.service,
        provider: data.provider,
        operation: data.operation,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async recordSuccess(data: Omit<ServiceUsageRecordInput, 'status' | 'errorMessage'>): Promise<void> {
    await this.record({
      ...data,
      status: 'success',
    });
  }

  async recordFailure(
    data: Omit<ServiceUsageRecordInput, 'status'> & {
      errorMessage?: string;
    }
  ): Promise<void> {
    await this.record({
      ...data,
      status: 'failed',
    });
  }
}

export const serviceUsageService = new ServiceUsageService();
