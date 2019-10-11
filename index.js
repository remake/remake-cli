const program = require('commander');
const Configstore = require('configstore');

const { clean, build, deploy, serve, updateFramework, create } = require('./utils/commands');
const { version, name } = require('./package.json');

log = console.log;

remakeCliConfig = new Configstore(name, { user: {} });
remakeServiceHost = 'http://127.0.0.1:3000';
program.version("v" + version);

program
  .option('create <project-dir>', 'Generate a new Remake project')
  .option('update-framework', 'Update the Remake framework in your project')
  .option('deploy', 'Deploy your Remake app on the Remake server')
  .option('build', 'Build your Remake app')
  .option('clean', 'Wipe the local Remake environment including caches and build assets')
  // .option('serve', 'Serve previously built Remake app');

module.exports = async () => {
  program.parse(process.argv);

  if (program.create) {
    let projectDir = program.create;
    create(projectDir);
  }

  if (program.updateFramework) {
    updateFramework();
  }

  if (program.deploy) {
    deploy();
  }

  if (program.build) {
    build();
  }

  if (program.clean) {
    clean();
  }

  if (program.serve) {
    serve();
  }
}