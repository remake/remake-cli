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
        log(chalk.bgRed('Could not log you in. Please try again.'));
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
        log(chalk.bgRed('Could not create your account. Please try again.'));
        return;
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
    console.log(err);
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
  log('Archiving files for upload.');
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();
    const output = fs.createWriteStream(path.join(cwd, `deployment-${projectName}.zip`), { encoding: 'base64' });
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('warning', (err) => {
      reject(err);
    });

    output.on('error', (err) => {
      reject(err);
    });

    output.on('close', () => {
      log(chalk.greenBright('Done archiving: ' + archive.pointer() + ' bytes.'));
      resolve();
    })

    archive.pipe(output);
    archive.glob('app/[a-z]*/**/*');
    archive.glob('_remake-data/*/*.json');
    archive.finalize();
  })
}

const removeDeploymentZip = (projectName) => {
  log('Cleaning up project directory.');
  const cwd = process.cwd();
  shell.rm(path.join(cwd, `deployment-${projectName}.zip`))
}

const pushZipToServer = async (projectName) => {
  log('Pushing your files to the deployment server.');
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
      log(chalk.greenBright('Files successfully uploaded to server.'))
    else throw new Error('Could not upload your files to the server.');
  } catch (err) {
    // console.log(err)
    throw new Error('Could not upload your files to the server.');
  }
}

module.exports = { checkSubdomain, registerSubdomain, registerUser, createDeploymentZip, removeDeploymentZip, pushZipToServer }