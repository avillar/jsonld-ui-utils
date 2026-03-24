import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import json from '@rollup/plugin-json';
import polyfillNode from 'rollup-plugin-polyfill-node';
import {terser} from "rollup-plugin-terser";

// IIFE bundles everything; ESM/CJS leaves runtime deps external so consumers' bundlers can deduplicate
const MODULE_EXTERNALS = ['n3', 'jsonld', 'rdfxml-streaming-parser'];

// Shims for the IIFE browser build:
//  - 'readable-stream': n3 imports Readable for its streaming match() API, which we don't use.
//  - 'node:*': jsonld/rdfxml-streaming-parser use node:-prefixed builtins; strip the prefix so
//    polyfillNode can handle them (polyfillNode only recognises unprefixed names).
//  - 'worker_threads', 'async_hooks', 'diagnostics_channel': Node-only APIs used in code paths
//    that never execute in a browser; stub them out as empty modules.
//  - 'stream/web', 'util/types': provide minimal browser-compatible implementations.
const browserShims = {
  name: 'browser-shims',
  async resolveId(id, importer) {
    if (id.startsWith('node:')) return this.resolve(id.slice(5), importer, {skipSelf: true});
    if (id === 'readable-stream') return '\0shim:readable-stream';
    if (['worker_threads', 'async_hooks', 'diagnostics_channel'].includes(id)) return '\0shim:empty';
    if (id === 'util/types') return '\0shim:util-types';
    if (id === 'stream/web') return '\0shim:stream-web';
  },
  load(id) {
    if (id === '\0shim:empty') return 'export default {};';
    if (id === '\0shim:util-types') return `
export function isUint8Array(v) { return v instanceof Uint8Array; }
export function isAnyArrayBuffer(v) { return v instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && v instanceof SharedArrayBuffer); }
export default { isUint8Array, isAnyArrayBuffer };
`;
    if (id === '\0shim:stream-web') return `
export const ReadableStream = globalThis.ReadableStream;
export const WritableStream = globalThis.WritableStream;
export const TransformStream = globalThis.TransformStream;
export default { ReadableStream, WritableStream, TransformStream };
`;
    if (id === '\0shim:readable-stream') return `
export class Readable {
  constructor() {}
  on() { return this; }
  once() { return this; }
  emit() { return this; }
  pipe() { return this; }
  push() { return false; }
  destroy() {}
  _read() {}
}
export class Writable {
  constructor() {}
  on() { return this; }
  write() {}
  end() {}
}
export class Transform extends Readable {}
export class PassThrough extends Transform {}
export default { Readable, Writable, Transform, PassThrough };
`;
  },
};

function onwarn(warning, warn) {
  // Expected and harmless: Rollup rewrites top-level `this` to undefined in ESM modules
  if (warning.code === 'THIS_IS_UNDEFINED') return;
  // Expected: circular refs inside rollup-plugin-polyfill-node's own shims and core-js internals
  if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids?.some(id => id.includes('polyfill-node') || id.includes('core-js'))) return;
  warn(warning);
}


export default [{
  input: "src/index.ts",
  onwarn,
  output: [
    {
      file: "dist/jsonld-ui-utils.min.js",
      format: "iife",
      name: "jsonldUIUtils",
      inlineDynamicImports: true,
      exports: "named",
      sourcemap: true,
    }
  ],
  plugins: [
    browserShims,
    polyfillNode(),
    resolve(),
    json({
      preferConst: true, // optional: smaller bundles
      compact: true,     // optional
    }),
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true, // important when deps ship mixed ESM/CJS
    }),
    typescript({tsconfig: "./tsconfig.json", sourceMap: true, inlineSources: true}),
    babel({
      babelHelpers: "bundled",
      presets: [
        ["@babel/preset-env", {
          targets: "> 0.5%, not dead",
          useBuiltIns: "usage",
          corejs: 3
        }]
      ]
    }),
    terser(),
  ],
}, {
  input: "src/index.ts",
  external: MODULE_EXTERNALS,
  output: [
    {
      file: "dist/index.esm.js",
      format: "esm",
      inlineDynamicImports: true,
      sourcemap: true,
    },
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      exports: "named",
      inlineDynamicImports: true,
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({browser: true, preferBuiltins: false}),
    json({preferConst: true, compact: true}),
    commonjs({include: /node_modules/, transformMixedEsModules: true}),
    typescript({tsconfig: "./tsconfig.json", sourceMap: true, inlineSources: true}),
    babel({
      babelHelpers: "bundled",
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {node: "16"}, // or browserslist for libraries
            useBuiltIns: false,
          },
        ],
      ],
      extensions: [".js", ".ts"],
    }),
  ],
}];
