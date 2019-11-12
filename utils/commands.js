const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');
const inquirer = require('inquirer');
const { promisify } = require('es6-promisify');
const rimraf = promisify(require('rimraf'));
const boxen = require('boxen');

const { readDotRemake, writeDotRemake, generateDotRemakeContent } = require('./dot-remake');
const { registerUser, checkSubdomain, registerSubdomain, createDeploymentZip, removeDeploymentZip, pushZipToServer } = require('./helpers');
const { questions } = require('./inquirer-questions');
const { getSuccessMessage } = require('./get-success-message');

const boxenOptions = {padding: 3, margin: 1, borderStyle: 'double', borderColor: 'green'};

const create = async (projectDir, options) => {
  const cwd = process.cwd();
  const newProjectDirPath = path.join(cwd, projectDir);
  let rimrafError = null;

  if (fs.existsSync(newProjectDirPath)) {
    log(chalk.bgRed("Error: Cannot write to a directory that already exists."));
    return;
  }

  // STEP 1
  log("Creating new project.");
  shell.exec(`git clone --depth 1 https://github.com/panphora/remake-framework.git ${projectDir}`, { silent: true });
  log(chalk.greenBright("Done."));

  // STEP 2a & 2b
  log("Tidy up new project directory.");
  rimrafError = await rimraf(path.join(newProjectDirPath, ".git"));

  if (rimrafError) {
    log(chalk.bgRed("Error: Couldn't remove old .git directory from new project."));
    return;
  }
  log(chalk.greenBright("Done."));

  // put project README in the right place
  shell.mv(path.join(newProjectDirPath, "README-FOR-BUNDLE.md"), path.join(newProjectDirPath, "README.md"));

  // STEP 3
  log("Installing npm dependencies.");
  shell.cd(newProjectDirPath);
  shell.exec("npm install", { silent: true });
  log(chalk.greenBright("Done."));

  // STEP 4
  // write project name and env variables to .remake file
  log("Setting up .remake");
  const dotRemakeObj = {
    ...generateDotRemakeContent(options.multitenant)
  }
  log(chalk.greenBright("Done."));

  const dotRemakeReady = writeDotRemake(dotRemakeObj);

  if (dotRemakeReady) {
    log(boxen(getSuccessMessage(projectDir), boxenOptions));
  }
}

const clean = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed('You are not in the root directory of a remake project.'));
    return;
  }
  log('Cleaning project.');
  shell.rm('-rf', '.cache/');
  shell.rm('-rf', '_remake/dist');
  log(chalk.greenBright('Done.'));
  // TODO - replace above statement with bellow statement once the framework is 
  // updated with the clean script
  // shell.exec('npm run clean');
}

const build = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed('You are not in the root directory of a remake project.'));
    return;
  }
  log('Building project.');
  shell.exec('npm run build', { silent: true });
  log(chalk.greenBright('Done.'));
}

const serve = () => {
  log('TODO');
}

const deploy = async () => {
  clean();
  build();

  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed('You are not in the root directory of a remake project.'));
    return;
  }
  await registerUser();

  if (!dotRemakeObj.projectName) {
    const subdomainAnswer = await inquirer.prompt([questions.INPUT_SUBDOMAIN]);
    log(`Checking if ${subdomainAnswer.subdomain}.remakeapps.com is available`);

    // check if name is available
    const isSubdomainAvailable = await checkSubdomain(subdomainAnswer.subdomain);
    if (!isSubdomainAvailable) {
      log(chalk.bgRed(`${subdomainAnswer.subdomain}.remakeapps.com is not available`));
      return;
    }
    log(chalk.greenBright(`${subdomainAnswer.subdomain}.remakeapps.com is available`));
    
    // prompt yes to confirm
    const confirmSubdomainAnswer = await inquirer.prompt([questions.CONFIRM_SUBDOMAIN]);
    if (confirmSubdomainAnswer.deployOk === false) {
      log(chalk.bgRed('Stopped deployment.'))
      return;
    }

    const subdomainRegistered = await registerSubdomain(subdomainAnswer.subdomain);
    if (!subdomainRegistered) {
      log(chalk.bgRed(`${subdomainAnswer.subdomain}.remakeapps.com could not be registered.
This may be a server related error. Please try again.`))
      return;
    }
    log(chalk.greenBright(`${subdomainAnswer.subdomain}.remakeapps.com is belonging to your app.`))
    
    dotRemakeObj.projectName = subdomainAnswer.subdomain
    const writtenDotRemake = writeDotRemake(dotRemakeObj)
    if (!writtenDotRemake) {
      log(chalk.bgRed('Could not write subdomain to .remake'));
      return;
    }
  }

  try {
    await createDeploymentZip(dotRemakeObj.projectName);
    await pushZipToServer(dotRemakeObj.projectName);
    // removeDeploymentZip(dotRemakeObj.projectName);
    log(chalk.greenBright(`The app is accessible at the URL: https://${dotRemakeObj.projectName}.remakeapps.com`))
  } catch (err) {
    log(chalk.bgRed(err.message));
    return;
  }
}

const updateFramework = async () => {
  let rimrafError = null;
  const cwd = process.cwd();
  const remakeFrameworkPathInApplicationDirectory = path.join(cwd, "_remake");
  log (remakeFrameworkPathInApplicationDirectory);
  
  // 1. CHECK IF _remake DIRECTORY EXISTS
  if (!fs.existsSync(remakeFrameworkPathInApplicationDirectory)) {
    log(chalk.bgRed("Error: Cannot find a _remake directory in this project."));
    return;
  }

  // 2. REMOVE OLD _remake DIRECTORY
  log("Removing old _remake directory.");
  rimrafError = await rimraf(remakeFrameworkPathInApplicationDirectory); // HERE

  if (rimrafError) {
    log(chalk.bgRed("Error: Couldn't remove old _remake directory."));
    return;
  }
  log(chalk.greenBright("Done."));

  // 3. GIT CLONE THE ENTIRE FULL STACK STARTER PROJECT INTO THE CURRENT DIRECTORY
  log("Copying latest framework into _remake directory.");
  shell.exec("git clone --depth 1 https://github.com/panphora/remake-framework.git", { silent: true });

  // 4. MOVE THE _remake DIRECTORY TO WHERE THE OLD _remake DIRECTORY WAS
  shell.mv(path.join(cwd, "remake-framework/_remake"), remakeFrameworkPathInApplicationDirectory);

  rimrafError = await rimraf(path.join(cwd, "remake-framework"))

  if (rimrafError) {
    log(chalk.bgRed("Error cleaning up: Couldn't remove the ./remake-framework directory."));
    return;
  }
  log(chalk.greenBright("Done."));

  log(chalk.greenBright('Framework successfully updated.'))
}

module.exports =  { create, deploy, serve, clean, build, updateFramework }