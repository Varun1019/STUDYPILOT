/**
 * RAG Chunking and Keyword Relevance Matcher
 * Splits notes into compact passages and finds the top 2-3 most relevant chunks.
 */

const STOP_WORDS = new Set([
  'the','and','is','in','it','of','to','for','a','an','this','that','what','how','why',
  'can','you','with','on','as','are','was','were','be','been','by','at','from','or','about'
]);

/**
 * Splits document text into word chunks with slight overlap
 */
export function chunkText(text, chunkSizeWords = 300, overlapWords = 50) {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= chunkSizeWords) {
    return [text.trim()];
  }

  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSizeWords);
    chunks.push(chunkWords.join(' '));
    i += (chunkSizeWords - overlapWords);
  }
  return chunks;
}

/**
 * Ranks chunks by keyword relevance to the user's query
 */
export function getTopRelevantChunks(query, notesList = [], topN = 3) {
  if (!notesList || notesList.length === 0) return [];
  
  // Collect all chunks tagged with their source note
  const allTaggedChunks = [];
  for (const note of notesList) {
    const text = note.extractedText || note.summary || '';
    if (!text) continue;
    const chunks = chunkText(text, 280, 40);
    for (const c of chunks) {
      allTaggedChunks.push({
        fileName: note.fileName || 'Notes',
        chunkText: c
      });
    }
  }

  if (allTaggedChunks.length <= topN) {
    return allTaggedChunks;
  }

  if (!query) {
    return allTaggedChunks.slice(0, topN);
  }

  const keywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  if (keywords.length === 0) {
    return allTaggedChunks.slice(0, topN);
  }

  const scored = allTaggedChunks.map(item => {
    const lower = item.chunkText.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      const matches = lower.match(new RegExp(kw, 'gi'));
      if (matches) {
        score += matches.length * (kw.length >= 5 ? 2 : 1);
      }
    }
    return { ...item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  
  // Return top N chunks that have positive relevance score (or top 2 as baseline)
  const topScored = scored.slice(0, topN);
  return topScored;
}
