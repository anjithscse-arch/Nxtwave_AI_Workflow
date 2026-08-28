/**
 * Citation Agent:
 * Extracts and deduplicates source references with filenames, page numbers, and similarity scores.
 *
 * @param {Object} pipelineContext
 * @returns {Promise<Object>} Updated pipeline context
 */
export async function executeCitationStage(pipelineContext) {
  const startTime = Date.now();
  const qualifyingChunks = pipelineContext.contextResult?.qualifyingChunks || [];
  const finalAnswer = pipelineContext.finalAnswer || '';

  if (qualifyingChunks.length === 0 || pipelineContext.isTerminated) {
    const durationMs = Date.now() - startTime;
    return {
      ...pipelineContext,
      citationResult: {
        sources: [],
        durationMs
      }
    };
  }

  // Deduplicate sources by filename and pageNumber
  const sourceMap = new Map();

  for (const chunk of qualifyingChunks) {
    const key = `${chunk.filename}_p${chunk.pageNumber}`;
    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        docId: chunk.docId,
        filename: chunk.filename,
        pageNumber: chunk.pageNumber,
        similarityScore: parseFloat((chunk.score || 0).toFixed(3)),
        snippet: chunk.text.slice(0, 160).trim() + '...'
      });
    }
  }

  const sources = Array.from(sourceMap.values());
  const durationMs = Date.now() - startTime;

  return {
    ...pipelineContext,
    citationResult: {
      sources,
      totalSources: sources.length,
      durationMs
    }
  };
}

export default executeCitationStage;
