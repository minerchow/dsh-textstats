const ID = 'dsh-text-stats'

// Module-table rows the shell seeds; see packages/client/web/src/platform.ts.
// Every one stays a runtime require() and is never inlined.
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  'zod',
  '@tanstack/react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

// Harness packages the Host already owns. Keeping them out of the bundle
// preserves Cordis/Schema module identity with the running profile; they are
// resolved at runtime from the install root (tsx workspace paths or the
// profile's node_modules).
const HOST_EXTERNALS = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/schemastery',
  '@deepseek-ai/dsh-tools',
]

// One build produces both halves. `dist/` is cleaned by the build script, so
// neither config may set `clean: true` or it would erase the other's output.
export default [
  {
    // Host half: ESM loaded by Cordis through the package root export.
    entry: { index: 'src/index.ts' },
    outDir: 'dist',
    format: 'esm',
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    sourcemap: true,
    clean: false,
    external: HOST_EXTERNALS,
    outExtension: () => ({ js: '.js' }),
  },
  {
    // Client half: a classic script registering one __ModuleLoader__ factory.
    entry: { client: 'src/client/index.tsx' },
    outDir: 'dist',
    format: 'cjs',
    platform: 'browser',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    sourcemap: true,
    clean: false,
    external: PLATFORM_MODULES,
    outExtension: () => ({ js: '.js' }),
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'import.meta.env.MODE': JSON.stringify('production'),
      'import.meta.env': JSON.stringify({ MODE: 'production' }),
    },
    outputOptions: {
      banner: 'window.__ModuleLoader__.load({ id: ' + JSON.stringify(ID) + ', factory: (require) => {',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; } });',
    },
  },
]
