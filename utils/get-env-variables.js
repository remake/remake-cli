const nanoidGenerate = require('nanoid/generate')

function getUniqueId () {
  return nanoidGenerate("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 30);
}

function getEnvVariables () {
  return {
    port: 3000,
    sessionSecret: getUniqueId()
  }
}

module.exports = {getEnvVariables}