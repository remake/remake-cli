const fs = require("fs");
const path = require('path');
const rimraf = require('rimraf');
const shell = require('shelljs');
const program = require('commander');
const ncp = require('ncp');
const boxen = require('boxen');
const chalk = require('chalk');
const { getSuccessMessage } = require('./utils/get-success-message');
const { getVariablesEnvFileText } = require('./utils/get-variables-env-file-text');
const { version } = require('./package.json');
let boxenOptions = {padding: 3, margin: 1, borderStyle: 'double', borderColor: 'green'};

program.version("v" + version);

program
  .option('create <project-dir>', 'Generate a new Remake project')
  .option('update-framework', 'Update the Remake framework in your project');


module.exports = () => {
  program.parse(process.argv);

  let bundlePath = path.join(__dirname, "bundle");
  let remakeFrameworkPath = path.join(bundlePath, "_remake");

  let projectDir = program.create;
  if (projectDir) {
    let ncpOptions = {clobber: false, dereference: false, stopOnErr: true};

    let newProjectDirPath = path.join(process.cwd(), projectDir);

    if (fs.existsSync(newProjectDirPath)) {
      console.log(chalk.bgRed("Error: Cannot write to a directory that already exists"));
      return;
    }

    // STEP 1
    console.log(chalk.bgGreen("(1/4) Creating new project"));
    shell.exec(`git clone --depth 1 https://github.com/panphora/remake-framework.git ${projectDir}`);

    // STEP 2a & 2b
    console.log(chalk.bgGreen("(2/4) Tidy up new project directory"));
    rimraf(path.join(newProjectDirPath, ".git"), function (rimrafError) {

      if (rimrafError) {
        console.log(chalk.bgRed("Error: Couldn't remove old .git directory from new project"));
        return;
      }

      // put project README in the right place
      shell.mv(path.join(newProjectDirPath, "README-FOR-BUNDLE.md"), path.join(newProjectDirPath, "README.md"));

      // STEP 3
      console.log(chalk.bgGreen("(3/4) Installing npm dependencies"));
      shell.cd(newProjectDirPath);
      shell.exec("npm install");

      // STEP 4
      console.log(chalk.bgGreen("(4/4) Setting up variables.env"));
      fs.writeFile(path.join(newProjectDirPath, "variables.env"), getVariablesEnvFileText(), function (err) {
        if (err) {
          console.log(chalk.bgRed("Error: Couldn't create variables.env file"));
          return;
        }
      
        // SUCCESS!!
        console.log(boxen(getSuccessMessage(projectDir), boxenOptions));
      });

    });

  }

  if (program.updateFramework) {
    let ncpOptions = {clobber: true, dereference: false, stopOnErr: true};
    let cwd = process.cwd();
    let remakeFrameworkPathInApplicationDirectory = path.join(process.cwd(), "_remake");
    
    // 1. CHECK IF _remake DIRECTORY EXISTS
    if (!fs.existsSync(remakeFrameworkPathInApplicationDirectory)) {
      console.log(chalk.bgRed("Error: Cannot find a _remake directory in this project"));
      return;
    }

    // 2. REMOVE OLD _remake DIRECTORY
    console.log(chalk.bgGreen("(1/2) Removing old _remake directory..."));
    rimraf(remakeFrameworkPathInApplicationDirectory, function (rimrafError) {

      if (rimrafError) {
        console.log(chalk.bgRed("Error: Couldn't remove old _remake directory"));
        return;
      }

      // 3. GIT CLONE THE ENTIRE FULL STACK STARTER PROJECT INTO THE CURRENT DIRECTORY
      console.log(chalk.bgGreen("(2/2) Copying framework into _remake directory..."));
      shell.exec("git clone --depth 1 https://github.com/panphora/remake-framework.git");

      // 4. MOVE THE _remake DIRECTORY TO WHERE THE OLD _remake DIRECTORY WAS
      let currentRemakeDir = path.join(cwd, "remake-framework/_remake");
      shell.mv(path.join(cwd, "remake-framework/_remake"), remakeFrameworkPathInApplicationDirectory);

      rimraf(path.join(cwd, "remake-framework"), function (rimrafError) {

        if (rimrafError) {
          console.log(chalk.bgRed("Error cleaning up: Couldn't remove the ./remake-framework directory"));
          return;
        }

        console.log(chalk.bgGreen("Successfully updated Remake!"));

      });

    });

  }
}
