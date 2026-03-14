import OpenAI, { toFile } from 'openai';
import { logger } from '@owl-mentors/utils';

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required');
  return new OpenAI({ apiKey });
}

export class WhisperService {
  async transcribe(audioUrl: string): Promise<string> {
    logger.info(`[Whisper] Downloading audio from Daily...`);
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio (${response.status}): ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const file = await toFile(buffer, 'recording.mp4', { type: 'audio/mp4' });

    logger.info(`[Whisper] Sending ${(buffer.length / 1024 / 1024).toFixed(1)}MB to Whisper API...`);
    const client = getClient();
    const result = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    logger.info(`[Whisper] Transcription complete (${result.text.length} chars)`);
    return result.text;
  }
}
