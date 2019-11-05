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

const getSubdomainAvailability = async (subdomain) => {
  const userEmail = remakeCliConfig.get('user.email');
  try {

    const availabilityRes = await axios({
      method: 'get',
      url: `${remakeServiceHost}/service/subdomain/availability`, 
      headers: {
        'Authorization': `Bearer ${remakeCliConfig.get('user.authToken')}`
      },
      params: {
        subdomain: subdomain,
        email: userEmail,
      }
    });
    if (availabilityRes.status === 200) return true;
    else return false;
  } catch (err) {
    return false;
  }
}

const createDeploymentZip = (projectName) => {
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
      log(chalk.greenBright('Done archiving! ' + archive.pointer() + ' total bytes.'));
      resolve();
    })

    archive.pipe(output);
    archive.glob('project-files/[a-z]*/*');
    archive.glob('_remake-data/user-app-data/*.json');
    archive.finalize();
  })
}

const removeDeploymentZip = (projectName) => {
  const cwd = process.cwd();
  shell.exec(`rm ${path.join(cwd, `deployment-${projectName}.zip`)}`);

}

const pushZipToServer = async (projectName) => {
  const email = remakeCliConfig.get('user.email');
  const cwd = process.cwd();
  const zipPath = path.join(cwd, `deployment-${projectName}.zip`);
  const formData = new FormData();
  formData.append('deployment', fs.readFileSync(zipPath), `${projectName}.zip`);
  formData.append('appName', projectName);
  formData.append('email', email);

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
      log(chalk.greenBright('App files successfully uploaded to server'))
    else throw new Error('Could not upload your files to the server');
  } catch (err) {
    throw new Error('Could not upload your files to the server');
  }
}

module.exports = { getSubdomainAvailability, registerUser, createDeploymentZip, removeDeploymentZip, pushZipToServer }