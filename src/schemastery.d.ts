// The running profile resolves @deepseek-ai/schemastery through the
// repository's vendored tsconfig paths. This standalone checkout has no
// published type entry for it, so declare the module for `pnpm tsc` only.
// Runtime code always loads the real vendored package.
declare module '@deepseek-ai/schemastery' {
  const Schema: {
    object(shape: Record<string, unknown>): unknown
    boolean(): { default(value: boolean): { volatile(): { description(text: string): unknown } } }
    union(values: unknown[]): { default(value: string): { volatile(): { description(text: string): unknown } } }
    const(value: string): { description(text: string): unknown }
  }
  export default Schema
}
