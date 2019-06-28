import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from "rollup-plugin-uglify";

export default [
  {
    input: 'index.js',
    output: {
      file: 'dist/bundle.cjs.js',
      format: 'cjs'
    },
    plugins: [
      babel({exclude: 'node_modules/**'}),
      resolve(),
      commonjs(),
      uglify()
    ]
  },{
    input: 'index.js',
    output: {
      file: 'dist/bundle.es6.js',
      format: 'esm'
    },
    plugins: [
      babel({exclude: 'node_modules/**'}),
      resolve(),
      commonjs()
    ]
  }
]

