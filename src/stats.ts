// Pure, dependency-free text-statistics logic.
//
// Kept free of Cordis/SDK imports so the config-driven behavior is unit-testable
// without the harness runtime. The host tool (src/index.ts) and any settings UI
// both delegate to this module.

/** Plugin configuration surface, mirrored from the Cordis Config schema. */
export interface TextStatsConfig {
  /** Also report the number of lines. */
  countLines: boolean
  /** How words are counted: whitespace-delimited runs, or CJK-aware splitting. */
  wordSplitMode: 'whitespace' | 'cjk'
  /** Language of the returned summary. */
  outputLanguage: 'en' | 'zh'
}

/** Default configuration; matches the schema defaults in src/index.ts. */
export const DEFAULT_CONFIG: TextStatsConfig = {
  countLines: false,
  wordSplitMode: 'whitespace',
  outputLanguage: 'zh',
}

/**
 * Count words in text according to the chosen split mode.
 * @param text - text to measure.
 * @param mode - 'whitespace' splits on runs of whitespace; 'cjk' also treats each
 *   CJK character (and fullwidth punctuation) as its own token while grouping
 *   non-CJK runs, so mixed-script text counts CJK characters individually.
 * @returns the word count.
 */
export function countWords(text: string, mode: TextStatsConfig['wordSplitMode']): number {
  if (mode === 'cjk') {
    const matches = text.match(
      /[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]|[^\s\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]+/g,
    )
    return matches === null ? 0 : matches.length
  }
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Build the human-readable summary the tool returns.
 * @param text - the text to analyze.
 * @param config - the effective plugin configuration.
 * @returns a localized summary string.
 */
export function buildSummary(text: string, config: TextStatsConfig = DEFAULT_CONFIG): string {
  const charCount = text.length
  const wordCount = countWords(text, config.wordSplitMode)
  if (config.outputLanguage === 'en') {
    const parts = [`Characters: ${String(charCount)}`, `Words: ${String(wordCount)}`]
    if (config.countLines) parts.push(`Lines: ${String(countLines(text))}`)
    return parts.join(', ')
  }
  const parts = [`字符数: ${String(charCount)}`, `单词数: ${String(wordCount)}`]
  if (config.countLines) parts.push(`行数: ${String(countLines(text))}`)
  return parts.join('，')
}

/** Count newline-separated lines, treating empty text as zero lines. */
function countLines(text: string): number {
  if (text.length === 0) return 0
  return text.split(/\n/).length
}
