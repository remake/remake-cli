const fs = require("fs");
const path = require('path');
const { promisify } = require('es6-promisify');
const rimraf = promisify(require('rimraf'));
const shell = require('shelljs');
const program = require('commander');
const boxen = require('boxen');
const chalk = require('chalk');
const nanoid = require('nanoid');
const inquirer = require('inquirer');

const { getSuccessMessage } = require('./utils/get-success-message');
const { generateDotRemakeContent, writeDotRemake, readDotRemake } = require('./utils/dot-remake');
const { version } = require('./package.json');

const boxenOptions = {padding: 3, margin: 1, borderStyle: 'double', borderColor: 'green'};
const log = console.log;

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

const validateSubdomain = (subdomain) => {
  const subdomainRegex = /^[a-z]+[a-z0-9\-]*$/
  if (subdomainRegex.test(subdomain) === null) 
    return 'The project name should start with a lowercase letter and should contain only lowercase letters, numbers and dashes.'
  else return true;
} 

const questions = {
  INPUT_SUBDOMAIN: {
    message: `Type a project name which will be used as a subdomain.
The project name should start with a lowercase letter and should contain only lowercase letters, numbers and dashes.
Your app will be accessible at <subdomain>.remaketheweb.com
> `,
    name: 'subdomain',
    type: 'input',
    validate: validateSubdomain
  },
  CONFIRM_SUBDOMAIN: {
    name: 'deployOk',
    message: 'Subdomain is available. Do you want to proceed?',
    type: 'confirm'
  }
}

const clean = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.yellow('You are not in the root directory of a remake project.'));
    return;
  }
  log(chalk.greenBright('Cleaning project'));
  // shell.exec('npm run clean');
  shell.exec('rm -rf .cache && rm -rf _remake/dist');
}

const build = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.yellow('You are not in the root directory of a remake project.'));
    return;
  }
  log(chalk.greenBright('Building project'));
  console.log(process.cwd())
  shell.exec('npm run build');
}

const serve = () => {
  log('TODO');
}

const deploy = (dotRemakeObj) => {
  clean();
  build();

  // push files to server
  // axios(/service/deploy)
  // {
  //    projectName
  //    projectFiles
  // }

  log(chalk.greenBright(`The app is accessible at this URL: https://${dotRemakeObj.projectName}.remaketheweb.com`))
}

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

    let dotRemakeObj = readDotRemake();
    if (!dotRemakeObj) {
      log(chalk.yellow('You are not in the root directory of a remake project.'));
      return;
    }
    if (!dotRemakeObj.projectName) {
      const subdomainAnswer = await inquirer.prompt([questions.INPUT_SUBDOMAIN])
      log(`Checking if ${subdomainAnswer.subdomain}.remaketheweb.com is available`)

      // check if name is available
      // ora
      // axios(/service/subdomain/availability)
      log (chalk.greenBright(`${subdomainAnswer.subdomain}.remaketheweb.com is available`))
      
      // prompt yes to confirm
      const answers = await inquirer.prompt([questions.CONFIRM_SUBDOMAIN]);
      if (answers.deployOk === false) {
        log(chalk.yellow('Stopped deployment.'))
        return;
      }
      
      dotRemakeObj.projectName = subdomainAnswer.subdomain
      log(dotRemakeObj);
      const writtenDotRemake = writeDotRemake(dotRemakeObj)
      if (!writtenDotRemake) {
        log(chalk.red('Could not write subdomain to .remake'));
        return;
      }
    }
    deploy(dotRemakeObj);

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
