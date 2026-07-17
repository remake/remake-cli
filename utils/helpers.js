const fs = require("fs");
const path = require("path");
const process = require("process");
const inquirer = require("inquirer");
const axios = require("axios");
const chalk = require("chalk");
const archiver = require("archiver");
const shell = require("shelljs");
const FormData = require("form-data");

const { questions } = require("./inquirer-questions");
const ora = require("ora");

let spinner = null;

const registerUser = async () => {
  const userEmail = remakeCliConfig.get("user.email");
  const authToken = remakeCliConfig.get("user.authToken");

  if (!userEmail || !authToken) {
    log(chalk.yellow(`Not logged in.`));

    let loginAnswers = await inquirer.prompt([
      questions.NEW_USER,
      questions.INPUT_EMAIL,
      questions.INPUT_PASSWORD,
    ]);
    if (loginAnswers.existingUser.startsWith("Yes")) {
      try {
        spinner = ora("Logging you in.").start();
        let res = await axios({
          method: "post",
          url: `${remakeServiceHost}/service/login`,
          data: {
            email: loginAnswers.email,
            password: loginAnswers.password,
          },
        });
        remakeCliConfig.set("user.email", loginAnswers.email);
        remakeCliConfig.set("user.authToken", res.data.token);
        spinner.succeed("You are successfuly logged in.");
      } catch (err) {
        spinner.fail("Could not log you in. Please try again.");
        process.exit();
      }
    } else {
      try {
        spinner = ora("Creating your account").start();
        let res = await axios({
          method: "post",
          url: `${remakeServiceHost}/service/signup`,
          data: {
            email: loginAnswers.email,
            password: loginAnswers.password,
          },
        });
        remakeCliConfig.set("user.email", loginAnswers.email);
        remakeCliConfig.set("user.authToken", res.data.token);
        spinner.succeed("Created your account and logged you in.");
      } catch (err) {
        if (err.response.data && err.response.data.message) {
          spinner.fail(err.response.data.message);
        } else {
          spinner.fail("Could not create your account. Please try again.");
        }
        process.exit();
      }
    }
  }
};

const checkSubdomain = async (subdomain) => {
  try {
    const availabilityRes = await axios({
      method: "get",
      url: `${remakeServiceHost}/service/subdomain/check`,
      headers: {
        Authorization: `Bearer ${remakeCliConfig.get("user.authToken")}`,
      },
      params: {
        subdomain,
      },
    });
    if (availabilityRes.status === 200) return true;
    else return false;
  } catch (err) {
    return false;
  }
};

const registerSubdomain = async (subdomain) => {
  try {
    const domainRegistered = await axios({
      method: "post",
      url: `${remakeServiceHost}/service/subdomain/register`,
      headers: {
        Authorization: `Bearer ${remakeCliConfig.get("user.authToken")}`,
      },
      data: {
        subdomain,
      },
    });
    if (domainRegistered.status === 200) return { success: true };
  } catch (err) {
    return { success: false, message: err.response.data.message };
  }
};

const createDeploymentZip = (projectName) => {
  const spinner = ora("Archiving files for upload.").start();
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();
    const output = fs.createWriteStream(
      path.join(cwd, `deployment-${projectName}.zip`),
      { encoding: "base64" },
    );
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("warning", (err) => {
      spinner.fail();
      reject(err);
    });

    output.on("error", (err) => {
      spinner.fail();
      reject(err);
    });

    output.on("close", () => {
      spinner.succeed("Done archiving: " + archive.pointer() + " bytes.");
      resolve();
    });

    archive.pipe(output);
    archive.glob("app/data/bootstrap.json");
    archive.glob("app/data/global.json");
    archive.glob("app/data/_remake-app-data.json");
    archive.glob("app/assets/**/*");
    archive.glob("app/layouts/**/*");
    archive.glob("app/pages/**/*");
    archive.glob("app/partials/**/*");
    archive.finalize();
  });
};

const removeDeploymentZip = (projectName) => {
  spinner = ora("Cleaning up project directory.").start();
  const cwd = process.cwd();
  shell.rm(path.join(cwd, `deployment-${projectName}.zip`));
  spinner.succeed();
};

const pushZipToServer = async (projectName) => {
  spinner = ora("Pushing your files to the deployment server.").start();
  const cwd = process.cwd();
  const zipPath = path.join(cwd, `deployment-${projectName}.zip`);
  const formData = new FormData();
  formData.append("deployment", fs.readFileSync(zipPath), `${projectName}.zip`);
  formData.append("appName", projectName);

  try {
    const res = await axios({
      method: "POST",
      url: `${remakeServiceHost}/service/deploy`,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${remakeCliConfig.get("user.authToken")}`,
      },
      data: formData.getBuffer(),
    });
    if (res.status === 200)
      spinner.succeed("Files successfully uploaded to server.");
    else {
      spinner.fail("Could not upload your files to the server.");
      throw new Error("Could not upload your files to the server.");
    }
  } catch (err) {
    spinner.fail("Could not upload your files to the server.");
    throw new Error(err);
  }
};

const getAppsList = async () => {
  const spinner = ora("Getting your apps list.").start();
  try {
    const appListResponse = await axios({
      method: "get",
      url: `${remakeServiceHost}/service/apps`,
      headers: {
        Authorization: `Bearer ${remakeCliConfig.get("user.authToken")}`,
      },
    });
    if (appListResponse.status === 200) {
      spinner.succeed();
      return appListResponse.data;
    } else {
      spinner.fail();
      return null;
    }
  } catch (err) {
    spinner.fail();
    return null;
  }
};

const addDomain = async (appName, domain) => {
  const spinner = ora(`Linking ${domain} to ${appName}.remakeapps.com`);
  try {
    const response = await axios({
      method: "post",
      url: `${remakeServiceHost}/service/domain`,
      headers: {
        Authorization: `Bearer ${remakeCliConfig.get("user.authToken")}`,
      },
      data: {
        domain,
        appName,
      },
    });
    if (response.status === 200) {
      spinner.succeed();
    } else {
      spinner.fail();
    }
  } catch (err) {
    spinner.fail();
    return null;
  }
};

const backupApp = async (appId) => {
  const spinner = ora("Generating and downlading zip.").start();
  try {
    const backupResponse = await axios({
      method: "get",
      url: `${remakeServiceHost}/service/backup`,
      responseType: "stream",
      headers: {
        Authorization: `Bearer ${remakeCliConfig.get("user.authToken")}`,
      },
      params: {
        appId,
      },
    });
    if (backupResponse.status === 200) {
      const fileName = backupResponse.headers["content-disposition"]
        .split("=")[1]
        .replace(/\"/g, "");
      const writer = fs.createWriteStream(fileName);
      backupResponse.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          spinner.succeed();
          resolve();
        });
        writer.on("error", () => {
          spinner.fail();
          reject();
        });
      });
    } else {
      spinner.fail();
      return null;
    }
  } catch (err) {
    spinner.fail();
    return null;
  }
};

module.exports = {
  checkSubdomain,
  registerSubdomain,
  registerUser,
  createDeploymentZip,
  removeDeploymentZip,
  pushZipToServer,
  getAppsList,
  backupApp,
  addDomain,
};
