const chalk = require("chalk");

function showSuccessfulCreationMessage(projectDir) {
  log(`
    ${chalk.magenta.bold("Your new Remake project has been created!")}

    1. Go into your new project's directory:
    ${chalk.green(`$ cd ${projectDir}`)}

    2. Start up the dev server:
    ${chalk.green(`$ npm run dev`)}

    3. Load the example app in a browser:
    ${chalk.green(`http://localhost:3000`)}

    4. Check out the quickstart: 
    ${chalk.green(`https://remaketheweb.com/quickstart`)}
`);
}

function showCustomDomainInfoMessage() {
  log(chalk.green(`Type a valid domain you own (e.g. myawesomeapp.com):`));
}

function showDnsMessage(domain) {
  log(chalk.green(`Add the following two records in your DNS manager:`));
  log(`A       @      45.55.126.252`);
  log(`CNAME   www    @`);

  log(
    `Your application will be available at https://${domain} and https://www.${domain}`,
  );
  log(`DNS propagation sometimes takes 4 hours or more.`);
}

module.exports = {
  showSuccessfulCreationMessage,
  showCustomDomainInfoMessage,
  showDnsMessage,
};
