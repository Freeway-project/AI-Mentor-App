/**
 * Core interfaces for the embedding subsystem.
 *
 * Embeddings convert text into fixed-length float vectors that capture semantic meaning.
 * Vectors for similar texts are "close" in vector space — the basis for semantic search.
 */

/** An embedding provider converts text into a vector of floats. */
export interface EmbeddingProvider {
  /**
   * Embed a string of text into a float vector.
   * @param text - The text to embed (will be truncated to model token limit)
   * @returns A float array (e.g. 1536 dims for text-embedding-3-small)
   */
  embed(text: string): Promise<number[]>;
}

/** Options passed to embed() — currently unused but reserved for model overrides. */
export interface EmbeddingOptions {
  model?: string;
}
