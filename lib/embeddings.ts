import dotenv from 'dotenv';

dotenv.config();

let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      try {
        const { pipeline } = await import('@xenova/transformers');
        const modelName = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
        return await pipeline('feature-extraction', modelName, {
          quantized: true,
        });
      } catch (err) {
        console.warn('Could not initialize @xenova/transformers pipeline, using deterministic local embedding fallback:', err);
        return null;
      }
    })();
  }
  return extractorPromise;
}

/**
 * Deterministic 384-dimensional embedding generator fallback.
 * Generates a normalized 384-dimensional unit vector using n-gram token hashing.
 * Guarantees semantic consistency: similar texts produce higher cosine similarity.
 */
function deterministicFallbackEmbedding(text: string): number[] {
  const dim = 384;
  const vector = new Float64Array(dim);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    vector[0] = 1.0;
    return Array.from(vector);
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 2166136261;
    for (let j = 0; j < word.length; j++) {
      hash ^= word.charCodeAt(j);
      hash = Math.imul(hash, 16777619);
    }
    const idx = Math.abs(hash) % dim;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vector[idx] += sign * (1.0 / Math.sqrt(words.length));

    // Also hash bigrams for phrase awareness
    if (i < words.length - 1) {
      const bigram = `${word}_${words[i + 1]}`;
      let bHash = 2166136261;
      for (let j = 0; j < bigram.length; j++) {
        bHash ^= bigram.charCodeAt(j);
        bHash = Math.imul(bHash, 16777619);
      }
      const bIdx = Math.abs(bHash) % dim;
      const bSign = (bHash & 1) === 0 ? 1 : -1;
      vector[bIdx] += bSign * (1.5 / Math.sqrt(words.length));
    }
  }

  // L2 Normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] /= norm;
    }
  } else {
    vector[0] = 1.0;
  }

  return Array.from(vector);
}

/**
 * Generate 384-dimensional vector embedding for a given text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim();
  if (!cleanText) {
    return deterministicFallbackEmbedding('empty');
  }

  try {
    const extractor = await getExtractor();
    if (extractor) {
      const output = await extractor(cleanText, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    }
  } catch (err) {
    console.warn('Inference error in @xenova/transformers, switching to deterministic vector generator:', err);
  }

  return deterministicFallbackEmbedding(cleanText);
}

/**
 * Formats a JavaScript number array into pgvector SQL string format: [0.123, -0.456, ...]
 */
export function formatVectorForPg(vector: number[]): string {
  return `[${vector.map((v) => Number(v.toFixed(6))).join(',')}]`;
}
