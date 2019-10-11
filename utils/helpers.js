const inquirer = require('inquirer');
const axios = require('axios');
const chalk = require('chalk');
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

module.exports = { getSubdomainAvailability, registerUser }