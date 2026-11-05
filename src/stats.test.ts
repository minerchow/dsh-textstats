// Dependency-free unit tests for the config-driven statistics logic.
// Run with: node --experimental-strip-types --test src/stats.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSummary, countWords, DEFAULT_CONFIG, type TextStatsConfig } from './stats.ts'

const BASE: TextStatsConfig = {
  countLines: false,
  wordSplitMode: 'whitespace',
  outputLanguage: 'zh',
}

function withConfig(over: Partial<TextStatsConfig>): TextStatsConfig {
  return { ...BASE, ...over }
}

test('default config keeps the original zh summary shape', () => {
  const out = buildSummary('hello world', DEFAULT_CONFIG)
  assert.equal(out, '字符数: 11，单词数: 2')
})

test('countLines appends the line count in zh', () => {
  const out = buildSummary('a\nb\nc', withConfig({ countLines: true }))
  assert.equal(out, '字符数: 5，单词数: 3，行数: 3')
})

test('empty text reports zero lines', () => {
  const out = buildSummary('', withConfig({ countLines: true }))
  assert.equal(out, '字符数: 0，单词数: 0，行数: 0')
})

test('whitespace mode counts space-delimited runs only', () => {
  assert.equal(countWords('foo bar   baz', 'whitespace'), 3)
  assert.equal(countWords('你好 world', 'whitespace'), 2)
})

test('cjk mode counts each CJK character as a word', () => {
  assert.equal(countWords('你好world', 'cjk'), 3)
  assert.equal(countWords('foo bar 你好', 'cjk'), 4)
})

test('english output language', () => {
  const out = buildSummary('hello world', withConfig({ outputLanguage: 'en' }))
  assert.equal(out, 'Characters: 11, Words: 2')
})

test('english output language with lines', () => {
  const out = buildSummary('a\nb', withConfig({ outputLanguage: 'en', countLines: true }))
  assert.equal(out, 'Characters: 3, Words: 2, Lines: 2')
})
