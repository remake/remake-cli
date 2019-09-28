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

  let projectDir = program.create;
  if (projectDir) {
    let ncpOptions = {clobber: false, dereference: false, stopOnErr: true};

    let newProjectDirPath = path.join(process.cwd(), projectDir);

    if (fs.existsSync(newProjectDirPath)) {
      console.log(chalk.bgRed("Error: Cannot write to a directory that already exists"));
      return;
    }

    // STEP 1
    console.log(chalk.bgGreen("(1/3) Creating new project"));

    ncp(bundlePath, newProjectDirPath, ncpOptions, function (err) {

      if (err) {
        console.log(chalk.bgRed("Error: Couldn't create new project files"));
        return;
      }

      // STEP 2
      console.log(chalk.bgGreen("(2/3) Installing npm dependencies"));
      shell.cd(newProjectDirPath);
      shell.exec("npm install");

      // STEP 3
      console.log(chalk.bgGreen("(3/3) Setting up variables.env"));
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

    let remakeFrameworkDirectoryPath = path.join(process.cwd(), "_remake");
    
    console.log(chalk.bgGreen("Important: Make sure you update to the latest version of the npm remake package before updating!"));

    if (!fs.existsSync(remakeFrameworkDirectoryPath)) {
      console.log(chalk.bgRed("Error: Cannot find a _remake directory in this project"));
      return;
    }

    rimraf(remakeFrameworkDirectoryPath, function (rimrafError) {

      if (rimrafError) {
        console.log(chalk.bgRed("Error: Couldn't remove old _remake directory"));
        return;
      }

      console.log(chalk.bgGreen("1. Old _remake directory removed..."));

      ncp(bundlePath, remakeFrameworkDirectoryPath, ncpOptions, function (err) {

        if (err) {
          console.log(chalk.bgRed("Error: Couldn't create new project files"));
          return;
        }

        console.log(chalk.bgGreen("2. Updated _remake directory added"));
        console.log(chalk.bgGreen("Successfully updated Remake!"));
      });
    });

  }
}
