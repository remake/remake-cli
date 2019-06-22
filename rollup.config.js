import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs',
    name: 'MyModule'
  },
  plugins: [
    resolve({

      // // the fields to scan in a package.json to determine the entry point
      // // if this list contains "browser", overrides specified in "pkg.browser"
      // // will be used
      // mainFields: ['module', 'main'], // Default: ['module', 'main']

      // // If true, inspect resolved files to check that they are
      // // ES2015 modules
      // modulesOnly: true, // Default: false

    })
  ]
};