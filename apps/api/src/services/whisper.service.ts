import OpenAI, { toFile } from 'openai';
import { logger } from '@owl-mentors/utils';
import { serviceUsageService } from './service-usage.service';

function getClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY environment variable is required');
  return new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
}

export class WhisperService {
  async transcribe(audioUrl: string): Promise<string> {
    const startTime = Date.now();
    let audioBytes = 0;

    try {
      logger.info(`[Whisper] Downloading audio from Daily...`);
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio (${response.status}): ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      audioBytes = buffer.length;
      const file = await toFile(buffer, 'recording.mp4', { type: 'audio/mp4' });

      logger.info(`[Whisper] Sending ${(buffer.length / 1024 / 1024).toFixed(1)}MB to Whisper API...`);
      const client = getClient();
      const result = await client.audio.transcriptions.create({
        file,
        model: 'whisper-large-v3',
      });

      logger.info(`[Whisper] Transcription complete (${result.text.length} chars)`);
      await serviceUsageService.recordSuccess({
        service: 'transcription',
        provider: 'groq',
        operation: 'transcribe_audio',
        model: 'whisper-large-v3',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: {
          audioBytes,
          transcriptChars: result.text.length,
        },
      });
      return result.text;
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'transcription',
        provider: 'groq',
        operation: 'transcribe_audio',
        model: 'whisper-large-v3',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: { audioBytes },
      });
      throw error;
    }
  }
}
