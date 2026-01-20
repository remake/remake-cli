// Import the Commander library for building CLI commands
const program = require("commander");

// Import Configstore to persist CLI configuration on the user's machine
const Configstore = require("configstore");

// Import command implementations from the utils/commands module
const {
  deploy,
  backup,
  updateFramework,
  create,
  linkDomain,
} = require("./utils/commands");

// Import version and name from package.json
const { version, name } = require("./package.json");

// Shortcut reference to console.log
log = console.log;

// Initialize configuration storage for the CLI using the package name
// Default config includes an empty user object
remakeCliConfig = new Configstore(name, { user: {} });

// Base URL for the Remake service
remakeServiceHost = "https://remakeapps.com";

// Configure the CLI version, flags, name, and usage pattern
program
  .version("v" + version, "-v, --version", "output the current version")
  .name("remake")
  .usage("command [--help]");

// Define the `create` command to scaffold a new Remake project
program
  .command("create <projectDir>")
  .description("Create a new Remake project")
  .option("-m, --multitenant", "create a multi tenant Remake app")
  .action((projectDir, options) => create(projectDir, options));

// Define the `update-framework` command to update Remake dependencies
program
  .command("update-framework")
  .description("Update the Remake framework in your project")
  .action(() => updateFramework());

// Define the `deploy` command to deploy the app to the Remake server
program
  .command("deploy")
  .description("Deploy your Remake app on the Remake server")
  .action(() => deploy());

// Define the `backup` command to back up the deployed application
program
  .command("backup")
  .description("Backup the deployed version of your app")
  .action(() => backup());

// Define the `custom-domain` command to link a domain to the app
program
  .command("custom-domain")
  .description("Link a custom domain to your application")
  .action(() => linkDomain());

// Export an async function that parses CLI arguments and executes commands
module.exports = async () => {
  program.parse(process.argv);
};
