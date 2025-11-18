import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.esm.js",
      format: "esm",
    },
    {
      file: "dist/index.cjs.js",
      format: "cjs",
    },
    {
      file: "dist/index.iife.js",
      format: "iife",
      name: "jsonldUIUtils",
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
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
  ]
};
