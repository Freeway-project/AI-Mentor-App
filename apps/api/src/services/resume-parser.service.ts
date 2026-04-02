import { v1 as documentai } from '@google-cloud/documentai';
import { AppError } from '../middleware/error.middleware';

export class ResumeParserService {
  private client: documentai.DocumentProcessorServiceClient | null = null;

  private getConfig() {
    const projectId = process.env.DOCUMENT_AI_PROJECT_ID;
    const location = process.env.DOCUMENT_AI_LOCATION || 'us';
    const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;

    if (!projectId || !processorId) {
      throw new AppError(
        503,
        'DOCUMENT_AI_NOT_CONFIGURED',
        'Document AI is not configured. Set DOCUMENT_AI_PROJECT_ID and DOCUMENT_AI_PROCESSOR_ID.'
      );
    }

    return { projectId, location, processorId };
  }

  private getClient(location: string) {
    if (!this.client) {
      this.client = new documentai.DocumentProcessorServiceClient({
        apiEndpoint: `${location}-documentai.googleapis.com`,
      });
    }

    return this.client;
  }

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      const { projectId, location, processorId } = this.getConfig();
      const client = this.getClient(location);
      const name = client.processorPath(projectId, location, processorId);
      const [result] = await client.processDocument({
        name,
        rawDocument: {
          content: buffer,
          mimeType,
        },
        skipHumanReview: true,
      });
      const text = result.document?.text?.replace(/\u0000/g, ' ').replace(/\s+\n/g, '\n').trim() ?? '';

      if (text.length < 120) {
        throw new AppError(400, 'RESUME_TEXT_TOO_SHORT', 'Could not extract enough text from this resume');
      }

      return text;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, 'RESUME_PARSE_FAILED', 'Unable to process resume with Document AI');
    }
  }
}
