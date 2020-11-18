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
  log(
    chalk.green(
      `Type a valid domain you own. Remake will take care of pointing the domain to your application.`
    )
  );
  log(
    `Remake doesn't work with subdomains at the moment. Remake doesn't offer a service for buying/managing domains.`
  );
  log(
    `Please make sure you already own the domain before initiating this step.`
  );
  log(`Good example: example.com`);
  log(`Bad examples: www.example.com, app.exapmple.com`);
}

function showDnsMessage(domain) {
  log(chalk.green(`Add the following two records in your DNS manager:`));
  log(`A       @      159.89.45.187`);
  log(`CNAME   www    @`);

  log(
    `Your application will be available at https://${domain} and https://www.${domain}`
  );
}

module.exports = {
  showSuccessfulCreationMessage,
  showCustomDomainInfoMessage,
  showDnsMessage,
};
