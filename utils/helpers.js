const fs = require('fs');
const path = require('path');
const process = require('process');
const inquirer = require('inquirer');
const axios = require('axios');
const chalk = require('chalk');
const archiver = require('archiver');
const shell = require('shelljs');
const FormData = require('form-data');

const { questions } = require('./inquirer-questions');
const ora = require('ora');

let spinner = null;

const registerUser = async () => {
  const userEmail = remakeCliConfig.get('user.email');
  const authToken = remakeCliConfig.get('user.authToken');

  if (!userEmail || !authToken) {
    log(chalk.yellow(`Not logged in.`));
    
    let loginAnswers = await inquirer.prompt([questions.NEW_USER, questions.INPUT_EMAIL, questions.INPUT_PASSWORD]);
    if (loginAnswers.existingUser.startsWith('Yes')) {
      try {
        spinner = ora('Logging you in.').start();
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
        spinner.succeed('You are successfuly logged in.');
      } catch (err) {
        spinner.fail('Could not log you in. Please try again.');
        process.exit();
      }
    } else {
      try{
        spinner = ora('Creating your account').start();
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
        spinner.succeed('Created your account and logged you in.');
      } catch (err) {
        spinner.fail('Could not create your account. Please try again.');
        process.exit();
      }
    }
  }
}

const checkSubdomain = async (subdomain) => {
  try {
    const availabilityRes = await axios({
      method: 'get',
      url: `${remakeServiceHost}/service/subdomain/check`, 
      headers: {
        'Authorization': `Bearer ${remakeCliConfig.get('user.authToken')}`
      },
      params: {
        subdomain,
      }
    });
    if (availabilityRes.status === 200) return true;
    else return false;
  } catch (err) {
    return false;
  }
}

const registerSubdomain = async (subdomain) => {
  try {
    const domainRegistered = await axios({
      method: 'post',
      url: `${remakeServiceHost}/service/subdomain/register`, 
      headers: {
        'Authorization': `Bearer ${remakeCliConfig.get('user.authToken')}`
      },
      data: {
        subdomain,
      }
    });
    if (domainRegistered.status === 200) return true;
    else return false;
  } catch (err) {
    return false;
  }
}

const createDeploymentZip = (projectName) => {
  const spinner = ora('Archiving files for upload.').start();
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();
    const output = fs.createWriteStream(path.join(cwd, `deployment-${projectName}.zip`), { encoding: 'base64' });
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('warning', (err) => {
      spinner.fail();
      reject(err);
    });

    output.on('error', (err) => {
      spinner.fail();
      reject(err);
    });

    output.on('close', () => {
      spinner.succeed('Done archiving: ' + archive.pointer() + ' bytes.');
      resolve();
    })

    archive.pipe(output);
    archive.glob('app/[a-z]*/**/*');
    archive.glob('_remake-data/*/*.json');
    archive.finalize();
  })
}

const removeDeploymentZip = (projectName) => {
  spinner = ora('Cleaning up project directory.').start();
  const cwd = process.cwd();
  shell.rm(path.join(cwd, `deployment-${projectName}.zip`))
  spinner.succeed();
}

const pushZipToServer = async (projectName) => {
  spinner = ora('Pushing your files to the deployment server.').start();
  const cwd = process.cwd();
  const zipPath = path.join(cwd, `deployment-${projectName}.zip`);
  const formData = new FormData();
  formData.append('deployment', fs.readFileSync(zipPath), `${projectName}.zip`);
  formData.append('appName', projectName);

  try {
    const res = await axios({
      method: 'POST',
      url: `${remakeServiceHost}/service/deploy`,
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${remakeCliConfig.get('user.authToken')}`,
      },
      data: formData.getBuffer()
    });
    if (res.status === 200)
      spinner.succeed('Files successfully uploaded to server.')
    else {
      spinner.fail('Could not upload your files to the server.');
      throw new Error('Could not upload your files to the server.')
    }
  } catch (err) {
    spinner.fail('Could not upload your files to the server.');
    throw new Error(err)
  }
}

module.exports = { checkSubdomain, registerSubdomain, registerUser, createDeploymentZip, removeDeploymentZip, pushZipToServer }