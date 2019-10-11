const chalk = require('chalk');
const shell = require('shelljs');
const inquirer = require('inquirer');
const { readDotRemake, writeDotRemake } = require('./dot-remake');
const { registerUser, getSubdomainAvailability } = require('./helpers');
const { questions } = require('./inquirer-questions');

const clean = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.yellow('You are not in the root directory of a remake project.'));
    return;
  }
  log(chalk.greenBright('Cleaning project'));
  shell.exec('rm -rf .cache && rm -rf _remake/dist');
  // TODO - replace above statement with bellow statement once the framework is 
  // updated with the clean script
  // shell.exec('npm run clean');
}

const build = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.yellow('You are not in the root directory of a remake project.'));
    return;
  }
  log(chalk.greenBright('Building project'));
  shell.exec('npm run build');
}

const serve = () => {
  log('TODO');
}

const deploy = async () => {
  clean();
  build();

  ///
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.yellow('You are not in the root directory of a remake project.'));
    return;
  }

  await registerUser();

  if (!dotRemakeObj.projectName) {
    const subdomainAnswer = await inquirer.prompt([questions.INPUT_SUBDOMAIN])
    log(`Checking if ${subdomainAnswer.subdomain}.remakeapps.com is available`)

    // check if name is available
    const isSubdomainAvailable = await getSubdomainAvailability(subdomainAnswer.subdomain);
    if (!isSubdomainAvailable) {
      log(chalk.red(`${subdomainAnswer.subdomain}.remakeapps.com is not available`))
      return;
    }
    log(chalk.greenBright(`${subdomainAnswer.subdomain}.remakeapps.com is available`))
    
    // prompt yes to confirm
    const confirmSubdomainAnswer = await inquirer.prompt([questions.CONFIRM_SUBDOMAIN]);
    if (confirmSubdomainAnswer.deployOk === false) {
      log(chalk.yellow('Stopped deployment.'))
      return;
    }
    
    dotRemakeObj.projectName = subdomainAnswer.subdomain
    const writtenDotRemake = writeDotRemake(dotRemakeObj)
    if (!writtenDotRemake) {
      log(chalk.red('Could not write subdomain to .remake'));
      return;
    }
  }
  // push files to server
  // axios(/service/deploy)
  // {
  //    projectName
  //    projectFiles
  // }

  log(chalk.greenBright(`The app is accessible at this URL: https://${dotRemakeObj.projectName}.remakeapps.com`))
}

module.exports =  { deploy, serve, clean, build }