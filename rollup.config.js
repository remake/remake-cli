import resolve from 'rollup-plugin-node-resolve';

export default [
  {
    input: 'index.js',
    output: {
      file: 'dist/bundle.cjs.js',
      format: 'cjs'
    },
    plugins: [
      resolve({})
    ]
  },{
    input: 'index.js',
    output: {
      file: 'dist/bundle.es6.js',
      format: 'esm'
    },
    plugins: [
      resolve({})
    ]
  }
]

