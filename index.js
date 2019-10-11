const fs = require("fs");
const path = require('path');
const { promisify } = require('es6-promisify');
const rimraf = promisify(require('rimraf'));
const shell = require('shelljs');
const program = require('commander');
const boxen = require('boxen');
const chalk = require('chalk');
const Configstore = require('configstore');

const { getSuccessMessage } = require('./utils/get-success-message');
const { generateDotRemakeContent, writeDotRemake, readDotRemake } = require('./utils/dot-remake');
const { clean, build, deploy, serve } = require('./utils/commands');
const { version, name } = require('./package.json');

const boxenOptions = {padding: 3, margin: 1, borderStyle: 'double', borderColor: 'green'};
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
  .option('serve', 'Serve previously built Remake app')

const cwd = process.cwd();

let rimrafError = null;

module.exports = async () => {
  program.parse(process.argv);

  let projectDir = program.create;
  if (projectDir) {

    let newProjectDirPath = path.join(cwd, projectDir);

    if (fs.existsSync(newProjectDirPath)) {
      log(chalk.bgRed("Error: Cannot write to a directory that already exists"));
      return;
    }

    // STEP 1
    log(chalk.bgGreen("(1/4) Creating new project"));
    shell.exec(`git clone --depth 1 https://github.com/panphora/remake-framework.git ${projectDir}`);

    // STEP 2a & 2b
    log(chalk.bgGreen("(2/4) Tidy up new project directory"));
    rimrafError = await rimraf(path.join(newProjectDirPath, ".git"));

    if (rimrafError) {
      log(chalk.bgRed("Error: Couldn't remove old .git directory from new project"));
      return;
    }

    // put project README in the right place
    shell.mv(path.join(newProjectDirPath, "README-FOR-BUNDLE.md"), path.join(newProjectDirPath, "README.md"));

    // STEP 3
    log(chalk.bgGreen("(3/4) Installing npm dependencies"));
    shell.cd(newProjectDirPath);
    shell.exec("npm install");

    // STEP 4
    // write project name and env variables to .remake file
    log(chalk.bgGreen("(4/4) Setting up .remake"));
    const dotRemakeObj = {
      ...generateDotRemakeContent()
    }

    const dotRemakeReady = writeDotRemake(dotRemakeObj);

    if (dotRemakeReady) {
      log(boxen(getSuccessMessage(projectDir), boxenOptions));
    }
  }

  if (program.updateFramework) {
    let remakeFrameworkPathInApplicationDirectory = path.join(cwd, "_remake");
    
    // 1. CHECK IF _remake DIRECTORY EXISTS
    if (!fs.existsSync(remakeFrameworkPathInApplicationDirectory)) {
      log(chalk.bgRed("Error: Cannot find a _remake directory in this project"));
      return;
    }

    // 2. REMOVE OLD _remake DIRECTORY
    log(chalk.bgGreen("(1/2) Removing old _remake directory..."));
    rimrafError = await rimraf(remakeFrameworkPathInApplicationDirectory);

    if (rimrafError) {
      console.log(rimrafError)
      log(chalk.bgRed("Error: Couldn't remove old _remake directory"));
      return;
    }

    // 3. GIT CLONE THE ENTIRE FULL STACK STARTER PROJECT INTO THE CURRENT DIRECTORY
    log(chalk.bgGreen("(2/2) Copying framework into _remake directory..."));
    shell.exec("git clone --depth 1 https://github.com/panphora/remake-framework.git");

    // 4. MOVE THE _remake DIRECTORY TO WHERE THE OLD _remake DIRECTORY WAS
    shell.mv(path.join(cwd, "remake-framework/_remake"), remakeFrameworkPathInApplicationDirectory);

    rimrafError = await rimraf(path.join(cwd, "remake-framework"))

    if (rimrafError) {
      log(chalk.bgRed("Error cleaning up: Couldn't remove the ./remake-framework directory"));
      return;
    }

    log(chalk.bgGreen("Successfully updated Remake!"));
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
