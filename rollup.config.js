import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import json from '@rollup/plugin-json';
import polyfillNode from 'rollup-plugin-polyfill-node';
import {terser} from "rollup-plugin-terser";

const EXTERNALS = ["rdflib"];
const GLOBALS = {
  "rdflib": "$rdf",
};


export default [{
  input: "src/index.ts",
  external: EXTERNALS,
  output: [
    {
      file: "dist/jsonld-ui-utils.min.js",
      format: "iife",
      name: "jsonldUIUtils",
      globals: GLOBALS,
      inlineDynamicImports: true,
      exports: "named",
    }
  ],
  plugins: [
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
    typescript({tsconfig: "./tsconfig.json"}),
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
  external: EXTERNALS,
  output: [
    {
      file: "dist/index.esm.js",
      format: "esm",
      inlineDynamicImports: true,
    },
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      exports: "named",
      inlineDynamicImports: true,
    },
  ],
  plugins: [
    resolve({browser: true, preferBuiltins: false}),
    json({preferConst: true, compact: true}),
    commonjs({include: /node_modules/, transformMixedEsModules: true}),
    typescript({tsconfig: "./tsconfig.json"}),
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
