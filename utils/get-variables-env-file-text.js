const nanoidGenerate = require('nanoid/generate')

function getUniqueId () {
  return nanoidGenerate("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 30);
}

function getVariablesEnvFileText () {
  return `PORT=3000
SESSION_SECRET=${getUniqueId()}`;
}

module.exports = {getVariablesEnvFileText}