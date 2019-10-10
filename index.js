const fs = require("fs");
const path = require('path');
const { promisify } = require('es6-promisify');
const rimraf = promisify(require('rimraf'));
const shell = require('shelljs');
const program = require('commander');
const boxen = require('boxen');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Configstore = require('configstore');
const axios = require('axios');

const { getSuccessMessage } = require('./utils/get-success-message');
const { generateDotRemakeContent, writeDotRemake, readDotRemake } = require('./utils/dot-remake');
const { version, name } = require('./package.json');

const boxenOptions = {padding: 3, margin: 1, borderStyle: 'double', borderColor: 'green'};
const log = console.log;
const remakeCliConfig = new Configstore(name, { user: {} });
const remakeServiceHost = 'http://127.0.0.1:3000';

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
  if (!subdomainRegex.test(subdomain)) 
    return 'The project name should start with a lowercase letter and should contain only lowercase letters, numbers and dashes.'
  else return true;
}

const validateEmail = (email) => {
  // regex source: https://stackoverflow.com/a/46181
  const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/
  if (!emailRegex.test(email)) {
    return 'Please provide a valid email address.';
  }
  else return true;
} 

const validatePass = (pass) => {
  // at least one digit and one letter + at least 8 chars long
  const passRegex = /^(?=.*\d)(?=.*[a-z])[a-z0-9]{8,}$/
  if (!passRegex.test(pass))
    return 'The password should be at least 8 characters long and it should contain at least one digit and a letter.';
  else return true;
}

const questions = {
  NEW_USER: {
    message: `Did you log in previously?`,
    name: 'existingUser',
    type: 'list',
    choices: ['Yes, proceed to login', 'No, create new account'],
  },
  INPUT_EMAIL: {
    message: `Email >`,
    name: 'email',
    type: 'input',
    validate: validateEmail,
  },
  INPUT_PASSWORD: {
    message: `Password >`,
    name: 'password',
    type: 'password',
    mask: '*',
    validate: validatePass
  },
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

const registerUser = async () => {
  const userEmail = remakeCliConfig.get('user.email');
  const authToken = remakeCliConfig.get('user.authToken');

  if (!userEmail || !authToken) {
    log(chalk.yellow(`Not logged in.`));
    
    let loginAnswers = await inquirer.prompt([questions.NEW_USER, questions.INPUT_EMAIL, questions.INPUT_PASSWORD]);
    if (loginAnswers.existingUser.startsWith('Yes')) {
      try {
        log('Logging you in.');
        let res = await axios({
          method: 'post',
          url: `${remakeServiceHost}/service/login`, 
          data: {
            email: loginAnswers.email,
            password: loginAnswers.password,
          }
        });
        remakeCliConfig.set('user.email', loginAnswers.email);
        remakeCliConfig.set('user.authToken', res.data.token);
        log(chalk.greenBright('You are successfuly logged in.'));
      } catch (err) {
        log(chalk.red('Could not log you in. Please try again.'));
        return;
      }
    } else {
      try{
        log('Creating your account');
        let res = await axios({
          method: 'post',
          url: `${remakeServiceHost}/service/signup`, 
          data: {
            email: loginAnswers.email,
            password: loginAnswers.password,
          }
        });
        remakeCliConfig.set('user.email', loginAnswers.email);
        remakeCliConfig.set('user.authToken', res.data.token);
        log(chalk.greenBright('Created your account and logged you in.'));
      } catch (err) {
        log(chalk.red('Could not create your account. Please try again.'));
        return;
      }
    }
  }
}

const isSubdomainAvailable = async (subdomain) => {
  const availabilityRes = await axios({
    method: 'get',
    url: `${remakeServiceHost}/service/subdomain/availability`, 
    headers: {
      'Authorization': `Bearer ${remakeCliConfig.get('user.authToken')}`
    },
    params: {
      subdomain: subdomain,
    }
  });

  if (availabilityRes.status === 200) return true;
  else return false;
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

    await registerUser();

    if (!dotRemakeObj.projectName) {
      const subdomainAnswer = await inquirer.prompt([questions.INPUT_SUBDOMAIN])
      log(`Checking if ${subdomainAnswer.subdomain}.remaketheweb.com is available`)

      // check if name is available
      if (!isSubdomainAvailable(subdomainAnswer.subdomain)) {
        log(chalk.red(`${subdomainAnswer.subdomain}.remaketheweb.com is not available`))
        return;
      }
      log(chalk.greenBright(`${subdomainAnswer.subdomain}.remaketheweb.com is available`))
      
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
