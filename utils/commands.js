const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const shell = require("shelljs");
const inquirer = require("inquirer");
const { promisify } = require("es6-promisify");
const rimraf = promisify(require("rimraf"));
const ora = require("ora");
const process = require("process");
const replace = require("replace");

const {
  readDotRemake,
  writeDotRemake,
  generateDotRemakeContent,
} = require("./dot-remake");
const {
  registerUser,
  checkSubdomain,
  registerSubdomain,
  createDeploymentZip,
  removeDeploymentZip,
  pushZipToServer,
  getAppsList,
  backupApp,
  addDomain,
} = require("./helpers");
const { questions } = require("./inquirer-questions");
const {
  showSuccessfulCreationMessage,
  showCustomDomainInfoMessage,
  showDnsMessage,
} = require("./messages");
const { exit } = require("process");

let spinner = null;

const create = async (projectName, options) => {
  const projectPath = getProjectPath(projectName);

  if (fs.existsSync(projectPath)) {
    log(chalk.bgRed("Error: Cannot write to a directory that already exists."));
    process.exit();
  }

  cloneRemakeFramework(projectName);
  await removeDotGit(projectName);
  cleanPackageJson(projectName);
  moveReadme();
  await setupTemplate();
  installNpmPackages();
  createDotRemakeFile(projectName, options);
  initializeGitRepo();
  process.exit(0);
};

const clean = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed("You are not in the root directory of a remake project."));
    process.exit();
  }
  spinner = ora("Cleaning project.").start();
  shell.exec("npm run clean", { silent: true });
  spinner.succeed();
};

const build = () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed("You are not in the root directory of a remake project."));
    process.exit();
  }
  spinner = ora("Building project.").start();
  const result = shell.exec("npm run build", { silent: true });
  if (result.code === 0) {
    spinner.succeed();
  } else {
    spinner.fail();
  }
};

const deploy = async () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed("You are not in the root directory of a remake project."));
    process.exit();
  }
  await registerUser();

  if (!dotRemakeObj.projectName) {
    const subdomainAnswer = await inquirer.prompt([questions.INPUT_SUBDOMAIN]);
    spinner = ora(
      `Checking if ${subdomainAnswer.subdomain}.remakeapps.com is available`
    ).start();

    // check if name is available
    const isSubdomainAvailable = await checkSubdomain(
      subdomainAnswer.subdomain
    );
    if (!isSubdomainAvailable) {
      spinner.fail(
        `${subdomainAnswer.subdomain}.remakeapps.com is not available`
      );
      process.exit();
    }
    spinner.succeed(`${subdomainAnswer.subdomain}.remakeapps.com is available`);

    // prompt yes to confirm
    const confirmSubdomainAnswer = await inquirer.prompt([
      questions.CONFIRM_SUBDOMAIN,
    ]);
    if (confirmSubdomainAnswer.deployOk === false) {
      log(chalk.bgRed("Stopped deployment."));
      process.exit();
    }

    spinner = ora(`Registering ${subdomainAnswer.subdomain}`).start();
    const subdomainRegistered = await registerSubdomain(
      subdomainAnswer.subdomain
    );
    if (!subdomainRegistered.success) {
      spinner.fail(subdomainRegistered.message);
      process.exit();
    }
    spinner.succeed(
      `${subdomainAnswer.subdomain}.remakeapps.com belongs to your app.`
    );

    spinner = ora(`Writing .remake file.`).start();
    dotRemakeObj.projectName = subdomainAnswer.subdomain;
    const writtenDotRemake = writeDotRemake(dotRemakeObj);
    if (!writtenDotRemake) {
      spinner.fail("Could not write subdomain to .remake");
      process.exit();
    }
    spinner.succeed();
  }

  try {
    await createDeploymentZip(dotRemakeObj.projectName);
    await pushZipToServer(dotRemakeObj.projectName);
    removeDeploymentZip(dotRemakeObj.projectName);
    log(
      chalk.greenBright(
        `The app is accessible at the URL: https://${dotRemakeObj.projectName}.remakeapps.com`
      )
    );
    process.exit();
  } catch (err) {
    log(chalk.bgRed(err.message));
    process.exit();
  }
};

const updateFramework = async () => {
  let rimrafError = null;
  const cwd = process.cwd();
  const remakeFrameworkPathInApplicationDirectory = path.join(cwd, "_remake");
  log(remakeFrameworkPathInApplicationDirectory);

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
  shell.exec(
    "git clone --depth 1 https://github.com/remake/remake-framework.git",
    { silent: true }
  );

  // 4. MOVE THE _remake DIRECTORY TO WHERE THE OLD _remake DIRECTORY WAS
  shell.mv(
    path.join(cwd, "remake-framework/_remake"),
    remakeFrameworkPathInApplicationDirectory
  );

  // 5. EXTEND APP'S PACKAGE.JSON WITH FRAMEWORK'S PACKAGE.JSON
  try {
    let packageJsonFromApp = JSON.parse(
      fs.readFileSync(path.join(cwd, "package.json"))
    );
    let packageJsonFromFramework = JSON.parse(
      fs.readFileSync(path.join(cwd, "remake-framework/package.json"))
    );
    Object.assign(
      packageJsonFromApp.dependencies,
      packageJsonFromFramework.dependencies
    );
    Object.assign(
      packageJsonFromApp.devDependencies,
      packageJsonFromFramework.devDependencies
    );
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify(packageJsonFromApp, null, 2)
    );
  } catch (packageJsonError) {
    spinner.fail(
      "Error with package.json: Couldn't copy dependencies from framework to app's package.json."
    );
    return;
  }

  rimrafError = await rimraf(path.join(cwd, "remake-framework"));

  if (rimrafError) {
    spinner.fail(
      "Error cleaning up: Couldn't remove the ./remake-framework directory."
    );
    return;
  }
  spinner.succeed();

  installNpmPackages();

  log(chalk.greenBright("Framework successfully updated."));
};

const backup = async () => {
  await registerUser();
  let appsList = await getAppsList();
  if (appsList.length === 0) {
    log(chalk.yellow("No apps deployed yet."));
    process.exit();
  } else {
    const question = questions.APP_BACKUP;
    question.choices = appsList.map((app) => ({
      name: app.name,
      value: app.id,
    }));
    const backupAnswer = await inquirer.prompt([question]);
    await backupApp(backupAnswer.appId);
    process.exit();
  }
};

const linkDomain = async () => {
  let dotRemakeObj = readDotRemake();
  if (!dotRemakeObj) {
    log(chalk.bgRed("You are not in the root directory of a remake project."));
    process.exit();
  }
  if (!dotRemakeObj.projectName) {
    log(
      chalk.bgRed(
        "Please deploy your application first by running: remake deploy"
      )
    );
    process.exit();
  }

  await registerUser();

  showCustomDomainInfoMessage();
  const domainAnswer = await inquirer.prompt([questions.INPUT_DOMAIN]);
  let domain = domainAnswer.domain;
  domain = domain.replace(/^(https?:\/\/)?(www.)?/i, "").replace(/\/$/, "");

  if (domain.split(".").length > 2) {
    log(
      chalk.yellow(
        "Remake doesn't support sub-domains at the moment (e.g. app.myawesomeapp.com)"
      )
    );
    log(chalk.yellow("You must use a root domain (e.g. myawesomeapp.com)"));
    process.exit();
  }

  showDnsMessage(domain);
  const dnsAnswer = await inquirer.prompt([questions.CONFIRM_DNS]);
  if (dnsAnswer.dnsOk === false) {
    process.exit();
  }

  await addDomain(dotRemakeObj.projectName, domainAnswer.domain);
  process.exit();
};

module.exports = {
  create,
  deploy,
  clean,
  build,
  updateFramework,
  backup,
  linkDomain,
};

function createDotRemakeFile(projectName, options) {
  spinner = ora("Setting up .remake").start();

  const dotRemakeObj = {
    ...generateDotRemakeContent(options.multitenant),
  };
  spinner.succeed();

  const dotRemakeReady = writeDotRemake(dotRemakeObj);
  if (!dotRemakeReady) {
    spinner.fail(chalk.bgRed("Error: Couldn't create .remake file"));
    exit(1);
  }
  showSuccessfulCreationMessage(projectName);
}

function getProjectPath(projectName) {
  const cwd = process.cwd();
  const projectPath = path.join(cwd, projectName);
  return projectPath;
}

function installNpmPackages() {
  spinner = ora("Installing npm dependencies.").start();
  shell.exec("npm install", { silent: true });
  spinner.succeed();
}

async function setupTemplate() {
  const { starter } = await inquirer.prompt([questions.CHOOSE_STARTER]);
  spinner = ora(`Cloning ${starter}`).start();
  shell.mkdir("starter-tmp");
  shell.exec(`git clone ${starter} starter-tmp`, { silent: true });
  shell.rm("starter-tmp/README.md");
  shell.rm("starter-tmp/.gitignore");
  rimrafError = await rimraf(path.join("starter-tmp", ".git"));
  shell.mv("starter-tmp/*", "app");
  rimrafError = await rimraf(path.join("starter-tmp"));
  spinner.succeed();
}

function moveReadme() {
  shell.mv("README-FOR-BUNDLE.md", "README.md");
}

function cleanPackageJson(projectName) {
  replace({
    regex: `"name": "remake-framework"`,
    replacement: `"name": "${projectName}"`,
    paths: [`${projectName}/package.json`],
    silent: true,
  });
  shell.cd(projectName);
  shell.exec(`npm version 1.0.0`);
  shell.cd(process.cwd());
}

function initializeGitRepo() {
  shell.exec("git init --quiet");
  shell.exec(`git add . && git commit -m "Initial commit" --quiet`);
}

async function removeDotGit(projectName) {
  spinner = ora("Tidy up new project directory.").start();
  const projectPath = getProjectPath(projectName);
  const rimrafError = await rimraf(path.join(projectPath, ".git"));
  if (rimrafError) {
    spinner.fail(
      chalk.bgRed("Error: Couldn't remove old .git directory from new project.")
    );
    process.exit();
  }
  spinner.succeed();
}

function cloneRemakeFramework(projectName) {
  spinner = ora("Creating new project.").start();
  shell.exec(
    `git clone --branch master https://github.com/remake/remake-framework.git ${projectName}`,
    { silent: true }
  );
  spinner.succeed();
}
