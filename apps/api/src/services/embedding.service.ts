import { MentorRepository, OfferRepository } from '@owl-mentors/database';
import { createEmbeddingClient, EmbeddingProvider } from '@owl-mentors/llm';
import { Mentor, Offer } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';

/**
 * EmbeddingService — orchestrates mentor profile embedding and semantic search.
 *
 * ## How it works
 *
 * ### Indexing (write path)
 * When a mentor saves their profile, we:
 *   1. Fetch the mentor + their session offers
 *   2. Concatenate key text fields into a single "profile document"
 *   3. Send that document to the Voyage AI Embeddings API → get float[1024]
 *   4. Store the vector in the mentor's MongoDB document (profileEmbedding field)
 *
 * ### Search (read path)
 * When a user searches with a natural language query:
 *   1. Embed the query string → float[1024]
 *   2. Run MongoDB $vectorSearch aggregation (cosine similarity)
 *   3. Return ranked mentors with a matchScore (0.0–1.0)
 *
 * ## Trigger points
 *   - PUT /mentor/me          (profile text updated)
 *   - POST /mentor/me/publish (profile published for review)
 *   - Admin approve action    (profile goes live — good time to (re)embed)
 *
 * ## Graceful degradation
 * Both embedMentor() and searchMentors() are designed to be non-blocking.
 * Callers should .catch() errors and fall back to keyword search if vector search fails.
 */
export class EmbeddingService {
  private embeddingClient: EmbeddingProvider;
  private mentorRepo: MentorRepository;
  private offerRepo: OfferRepository;

  constructor() {
    this.embeddingClient = createEmbeddingClient();
    this.mentorRepo = new MentorRepository();
    this.offerRepo = new OfferRepository();
  }

  /**
   * Build a single text document representing a mentor's profile.
   *
   * Field order is intentional — more important signals come first:
   *   headline > bio > specialties > expertise > languages > offer descriptions
   *
   * @param mentor - Mentor domain object
   * @param offers - The mentor's session offers (optional — included when available)
   * @returns Concatenated profile text, or empty string if profile has no content yet
   */
  buildMentorDocument(mentor: Mentor, offers: Offer[] = []): string {
    const parts: string[] = [];

    if (mentor.headline) parts.push(mentor.headline);
    if (mentor.bio) parts.push(mentor.bio);
    if (mentor.specialties?.length) parts.push(`Skills: ${mentor.specialties.join(', ')}`);
    if (mentor.expertise?.length) parts.push(`Expertise: ${mentor.expertise.join(', ')}`);
    if (mentor.languages?.length && mentor.languages.join('') !== 'English') {
      parts.push(`Languages: ${mentor.languages.join(', ')}`);
    }
    for (const offer of offers) {
      const offerText = [offer.title, offer.description].filter(Boolean).join('. ');
      if (offerText) parts.push(`Session: ${offerText}`);
    }

    return parts.join('. ');
  }

  /**
   * Embed a mentor's profile and persist the vector to MongoDB.
   *
   * This method is intentionally non-blocking — call it without await
   * so that a mentor's profile save is never delayed by the embedding API call.
   *
   * @example
   * // In mentor.routes.ts, after a successful profile update:
   * embeddingService.embedMentor(mentor.id).catch(err =>
   *   logger.error(`[Embedding] Failed: ${err.message}`)
   * );
   *
   * @param mentorId - The mentor's database ID
   */
  async embedMentor(mentorId: string): Promise<void> {
    const mentor = await this.mentorRepo.findById(mentorId);
    const offers = await this.offerRepo.findByMentorId(mentorId);

    const text = this.buildMentorDocument(mentor, offers);
    if (!text.trim()) {
      logger.info(`[Embedding] Skipping mentor ${mentorId} — no profile content yet`);
      return;
    }

    const embedding = await this.embeddingClient.embed(text);
    await this.mentorRepo.updateEmbedding(mentorId, embedding);

    logger.info(`[Embedding] Mentor ${mentorId} embedded (${embedding.length} dims)`);
  }

  /**
   * Embed a search query and return semantically matched mentors from Atlas Vector Search.
   *
   * Falls back gracefully — if vector search fails, the caller should use keyword search.
   *
   * @param query - Natural language query, e.g. "I want to learn system design"
   * @param limit - Max results to return (default 12)
   * @returns Mentors sorted by semantic similarity, each with a matchScore (0.0–1.0)
   */
  async searchMentors(query: string, limit = 12): Promise<(Mentor & { matchScore?: number })[]> {
    const queryEmbedding = await this.embeddingClient.embed(query);
    return this.mentorRepo.vectorSearch(queryEmbedding, limit);
  }
}
