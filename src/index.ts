import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'text-stats'
export const inject = ['tools']

export function apply(ctx: any) {
  console.log('[text-stats] plugin loaded!')

  ctx.tools.register(
    defineTool({
      name: 'text_stats',
      description: '统计一段文字的字符数和单词数',
      parameters: {
        text: {
          type: 'string',
          required: true,
          description: '要统计的文字',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: any, value: any) => [{ type: 'text', text: value as string }],
      },
      async execute(args: any) {
        const text = args.text
        const charCount = text.length
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length
        return `字符数: ${charCount}，单词数: ${wordCount}`
      },
    } as any),
  )
}
