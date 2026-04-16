import { v1 as documentai } from '@google-cloud/documentai';
import { AppError } from '../middleware/error.middleware';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const { PDFParse } = _require('pdf-parse') as { PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }> } };
import mammoth from 'mammoth';

export class ResumeParserService {
  private client: documentai.DocumentProcessorServiceClient | null = null;

  private isDocumentAIConfigured() {
    return !!(process.env.DOCUMENT_AI_PROJECT_ID && process.env.DOCUMENT_AI_PROCESSOR_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

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
      const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!credentialPath) {
        throw new AppError(
          503,
          'DOCUMENT_AI_CREDENTIALS_MISSING',
          'Document AI credentials are missing. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON key path.'
        );
      }

      this.client = new documentai.DocumentProcessorServiceClient({
        apiEndpoint: `${location}-documentai.googleapis.com`,
      });
    }

    return this.client;
  }

  /** Fallback: extract text locally using pdf-parse / mammoth */
  private async extractTextLocally(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text?.trim() ?? '';
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value?.trim() ?? '';
    }

    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Only PDF and DOCX files are supported without Document AI configured.');
  }

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    // Use local extraction if Document AI is not configured
    if (!this.isDocumentAIConfigured()) {
      const text = await this.extractTextLocally(buffer, mimeType);
      if (text.length < 120) {
        throw new AppError(400, 'RESUME_TEXT_TOO_SHORT', 'Could not extract enough text from this resume');
      }
      return text;
    }

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

      const message = (error as Error).message || '';
      if (
        /default credentials|Could not load the default credentials|Could not load credentials|ENOENT|ECONNREFUSED/i.test(message)
      ) {
        throw new AppError(
          503,
          'DOCUMENT_AI_CREDENTIALS_INVALID',
          'Document AI could not load Google credentials. Check GOOGLE_APPLICATION_CREDENTIALS and the service account key file.'
        );
      }

      throw new AppError(400, 'RESUME_PARSE_FAILED', 'Unable to process resume with Document AI');
    }
  }
}
