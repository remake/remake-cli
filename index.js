const program = require("commander");
const Configstore = require("configstore");

const {
  clean,
  build,
  deploy,
  backup,
  updateFramework,
  create,
} = require("./utils/commands");
const { version, name } = require("./package.json");

log = console.log;

remakeCliConfig = new Configstore(name, { user: {} });
remakeServiceHost = "https://remakeapps.com";

program
  .version("v" + version, "-v, --version", "output the current version")
  .name("remake")
  .usage("command [--help]");

program
  .command("create <projectDir>")
  .description("Create a new Remake project")
  .option("-m, --multitenant", "create a multi tenant Remake app")
  .action((projectDir, options) => create(projectDir, options));

program
  .command("update-framework")
  .description("Update the Remake framework in your project")
  .action(() => updateFramework());

program
  .command("deploy")
  .description("Deploy your Remake app on the Remake server")
  .action(() => deploy());

program
  .command("backup")
  .description("Backup the deployed version of your app")
  .action(() => backup());

module.exports = async () => {
  program.parse(process.argv);
};
