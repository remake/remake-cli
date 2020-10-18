const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');
const inquirer = require('inquirer');
const { promisify } = require('es6-promisify');
const rimraf = promisify(require('rimraf'));
const ora = require('ora');
const process = require('process');

const { readDotRemake, writeDotRemake, generateDotRemakeContent } = require('./dot-remake');
const {
  registerUser,
  checkSubdomain,
  registerSubdomain,
  createDeploymentZip,
  removeDeploymentZip,
  pushZipToServer,
  getAppsList,
  backupApp } = require('./helpers');
const { questions } = require('./inquirer-questions');
const { showSuccessfulCreationMessage } = require('./messages');

let spinner = null;

const create = async (projectDir, options) => {
  const cwd = process.cwd();
  const newProjectDirPath = path.join(cwd, projectDir);
  let rimrafError = null;

  if (fs.existsSync(newProjectDirPath)) {
    log(chalk.bgRed("Error: Cannot write to a directory that already exists."));
    process.exit();
  }

  // STEP 1
  spinner = ora("Creating new project.").start();
  shell.exec(`git clone --depth 1 https://github.com/remake/remake-framework.git ${projectDir}`, { silent: true });
  spinner.succeed();

  // STEP 2a & 2b
  spinner = ora("Tidy up new project directory.").start();
  rimrafError = await rimraf(path.join(newProjectDirPath, ".git"));

  if (rimrafError) {
    spinner.fail(chalk.bgRed("Error: Couldn't remove old .git directory from new project."));
    process.exit();
  }
  spinner.succeed();

  // put project README in the right place
  shell.mv(path.join(newProjectDirPath, "README-FOR-BUNDLE.md"), path.join(newProjectDirPath, "README.md"));

  // STEP 3
  spinner = ora("Installing npm dependencies.").start();
  shell.cd(newProjectDirPath);
  shell.exec("npm install", { silent: true });
  spinner.succeed();

  // STEP 4
  // write project name and env variables to .remake file
  spinner = ora("Setting up .remake").start();
  const dotRemakeObj = {
    ...generateDotRemakeContent(options.multitenant)
  }
  spinner.succeed();

  const dotRemakeReady = writeDotRemake(dotRemakeObj);

  if (dotRemakeReady) {
    showSuccessfulCreationMessage(projectDir);
  }
}

const clean = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed('You are not in the root directory of a remake project.'));
    process.exit();
  }
  spinner = ora('Cleaning project.').start();
  shell.rm('-rf', '.cache/');
  shell.rm('-rf', '_remake/dist');
  spinner.succeed();
  // TODO - replace above statement with bellow statement once the framework is 
  // updated with the clean script
  // shell.exec('npm run clean');
}

const build = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed('You are not in the root directory of a remake project.'));
    process.exit();
  }
  spinner = ora('Building project.').start();
  const result = shell.exec('npm run build', { silent: true });
  if (result.code === 0) {
    spinner.succeed();
  } else {
    spinner.fail();
  }
}

const deploy = async () => {
  clean();
  build();

  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed('You are not in the root directory of a remake project.'));
    process.exit();
  }
  await registerUser();

  if (!dotRemakeObj.projectName) {
    const subdomainAnswer = await inquirer.prompt([questions.INPUT_SUBDOMAIN]);
    spinner = ora(`Checking if ${subdomainAnswer.subdomain}.remakeapps.com is available`).start();
    
    // check if name is available
    const isSubdomainAvailable = await checkSubdomain(subdomainAnswer.subdomain);
    if (!isSubdomainAvailable) {
      spinner.fail(`${subdomainAnswer.subdomain}.remakeapps.com is not available`);
      process.exit();
    }
    spinner.succeed(`${subdomainAnswer.subdomain}.remakeapps.com is available`);
    
    // prompt yes to confirm
    const confirmSubdomainAnswer = await inquirer.prompt([questions.CONFIRM_SUBDOMAIN]);
    if (confirmSubdomainAnswer.deployOk === false) {
      log(chalk.bgRed('Stopped deployment.'));
      process.exit();
    }

    spinner = ora(`Registering ${subdomainAnswer.subdomain}`).start();
    const subdomainRegistered = await registerSubdomain(subdomainAnswer.subdomain);
    if (!subdomainRegistered.success) {
      spinner.fail(subdomainRegistered.message)
      process.exit();
    }
    spinner.succeed(`${subdomainAnswer.subdomain}.remakeapps.com is belonging to your app.`);
    
    spinner = ora(`Writing .remake file.`).start();
    dotRemakeObj.projectName = subdomainAnswer.subdomain
    const writtenDotRemake = writeDotRemake(dotRemakeObj)
    if (!writtenDotRemake) {
      spinner.fail('Could not write subdomain to .remake');
      process.exit();
    }
    spinner.succeed();
  }

  try {
    await createDeploymentZip(dotRemakeObj.projectName);
    await pushZipToServer(dotRemakeObj.projectName);
    removeDeploymentZip(dotRemakeObj.projectName);
    log(chalk.greenBright(`The app is accessible at the URL: https://${dotRemakeObj.projectName}.remakeapps.com`))
    process.exit();
  } catch (err) {
    log(chalk.bgRed(err.message));
    process.exit();
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
  spinner = ora("Removing old _remake directory.").start();
  rimrafError = await rimraf(remakeFrameworkPathInApplicationDirectory); // HERE

  if (rimrafError) {
    spinner.fail("Error: Couldn't remove old _remake directory.");
    return;
  }
  spinner.succeed();

  // 3. GIT CLONE THE ENTIRE FULL STACK STARTER PROJECT INTO THE CURRENT DIRECTORY
  spinner = ora("Copying latest framework into _remake directory.").start();
  shell.exec("git clone --depth 1 https://github.com/remake/remake-framework.git", { silent: true });

  // 4. MOVE THE _remake DIRECTORY TO WHERE THE OLD _remake DIRECTORY WAS
  shell.mv(path.join(cwd, "remake-framework/_remake"), remakeFrameworkPathInApplicationDirectory);

  rimrafError = await rimraf(path.join(cwd, "remake-framework"))

  if (rimrafError) {
    spinner.fail("Error cleaning up: Couldn't remove the ./remake-framework directory.");
    return;
  }
  spinner.succeed();

  log(chalk.greenBright('Framework successfully updated.'))
}

const backup = async () => {
  await registerUser();
  let appsList = await getAppsList();
  if (appsList.length === 0) {
    log(chalk.yellow('No apps deployed yet.'));
    process.exit();
  } else {
    const question = questions.APP_BACKUP;
    question.choices = appsList.map((app) => ({ name: app.name, value: app.id }));
    const backupAnswer = await inquirer.prompt([question]);
    await backupApp(backupAnswer.appId);
    process.exit();
  }
}

module.exports =  { create, deploy, clean, build, updateFramework, backup }