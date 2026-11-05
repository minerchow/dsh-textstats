// Host plugin: registers the text_stats tool with a Cordis Config schema so the
// harness settings UI can expose a configuration form (namespace = entry id
// 'test-stats'). Every form-editable field is declared volatile; volatile
// fields arrive at apply() as live references, so execute() reads them through
// their current snapshot. The tool delegates counting to src/stats.ts.
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { buildSummary, DEFAULT_CONFIG, type TextStatsConfig } from './stats.ts'

export const name = 'text-stats'
export const inject = ['tools']

/** Validated, documented configuration the settings UI edits. */
export interface Config extends TextStatsConfig {}

/** One volatile config field as delivered at runtime: a live reference. */
interface LiveField<T> {
  /** @returns the current immutable value snapshot. */
  get(): T
}

/** Runtime config face: each volatile field arrives as a live reference; plain values stand in for direct defaults. */
type LiveConfig = {
  [K in keyof TextStatsConfig]: LiveField<TextStatsConfig[K]> | TextStatsConfig[K]
}

/** Read one config field's current value, accepting the live reference or a plain value. */
function current<T>(field: LiveField<T> | T): T {
  if (typeof field === 'object' && field !== null && 'get' in field) return (field as LiveField<T>).get()
  return field
}

/** Schema-projected, revision-safe configuration form; `.volatile()` marks the fields the settings form edits live. */
export const Config = Schema.object({
  countLines: Schema.boolean().default(DEFAULT_CONFIG.countLines).volatile()
    .description('Also report the number of lines in the text.'),
  wordSplitMode: Schema.union([
    Schema.const('whitespace').description('Split on runs of whitespace.'),
    Schema.const('cjk').description('Also count each CJK character as a word.'),
  ]).default(DEFAULT_CONFIG.wordSplitMode).volatile()
    .description('How words are counted.'),
  outputLanguage: Schema.union([
    Schema.const('en').description('English summary.'),
    Schema.const('zh').description('Chinese summary.'),
  ]).default(DEFAULT_CONFIG.outputLanguage).volatile()
    .description('Language of the returned summary.'),
})

export function apply(ctx: any, config: LiveConfig = DEFAULT_CONFIG) {
  console.log('[text-stats] plugin loaded!')

  ctx.tools.register(
    defineTool({
      name: 'text_stats',
      description: 'Count the characters and words in a text. MUST be called whenever the user asks to count characters, words, or lines in any string (e.g. 请统计这句话有多少个字符和单词); never compute those counts yourself or answer from your own estimate. Pass the exact text to analyze as `text`. The returned summary also follows the plugin settings for line count and output language.',
      parameters: {
        text: {
          type: 'string',
          required: true,
          description: 'the text to count',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: any, value: any) => [{ type: 'text', text: value as string }],
      },
      async execute(args: any) {
        const effective: TextStatsConfig = {
          countLines: current(config.countLines),
          wordSplitMode: current(config.wordSplitMode),
          outputLanguage: current(config.outputLanguage),
        }
        return buildSummary(args.text as string, effective)
      },
    } as any),
  )
}
