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

module.exports = { showSuccessfulCreationMessage };
