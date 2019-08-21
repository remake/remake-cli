const dirTree = require("directory-tree");
const tree = dirTree("./project-files", {
  extensions: /\.(hbs|json)$/
});
const util = require("util");
const fs = require("fs");
const path = require("path");
const jsonfile = require("jsonfile");
const camelCase = require("camelcase");
import forEachDeep from "deepdash-es/forEachDeep";
import { isPlainObject } from "lodash-es";
import { showConsoleError } from "../utils/console-utils";
let layoutNameRegex = /\{\{\s+layout\s+["'](\w+)["']\s+\}\}/;
let yieldCommandRegex = /\{\{>\s+yield\s+\}\}/;


// app folders that start with an underscore don't have app data associated with them
function _getProjectInfo () {
  let baseRoutes = [];
  let usernameRoutes = [];
  let partials = [];

  forEachDeep(tree, function (value, key, parent, context) {

    if (value.extension === ".hbs") {
      let fileName = value.name.replace(value.extension, ""); // e.g. "todos"
      let templatePath = path.join(__dirname, "../../", value.path); // e.g. "../../project-files/pages/todos.hbs"
      let _templateString = fs.readFileSync(templatePath, "utf8"); 

      // check if we're in the /pages directory
      if (templatePath.includes("/pages")) {

        // find the current page's layout (either explicitly named or the "default" layout)
        let layoutNameMatch = _templateString.match(layoutNameRegex);
        let layoutName = layoutNameMatch ? layoutNameMatch[1] : "default";

        // remove the special "layout" command from the page template
        let templateStringCleaned = _templateString.replace(layoutNameRegex, "");

        // insert the page template into its layout
        let layoutTemplateString = fs.readFileSync(path.join(__dirname, `../../project-files/layouts/${layoutName}.hbs`), "utf8");
        let templateString = layoutTemplateString.replace(yieldCommandRegex, templateStringCleaned);

        // create the base route (these need to render BEFORE dynamic :username routes)
        let baseRoute = fileName === "index" ? "/" : `/${fileName}`; // e.g. /todos
        // create the dynamic username route
        let usernameRoute = fileName === "index" ? "/:username" : `/:username/${fileName}/:id?`; // e.g. /john/todos/123


        baseRoutes.push({
          route: baseRoute,
          templateString
        });

        usernameRoutes.push({
          route: usernameRoute,
          templateString
        });

      } else if (templatePath.includes("/partials")) {

        let pathToBootstrapData = path.join(__dirname, `../../project-files/_bootstrap-data/partials/${fileName}.json`);

        let bootstrapData;
        try {
          bootstrapData = jsonfile.readFileSync(pathToBootstrapData);
        } catch (e) {
          bootstrapData = {};
        }

        partials.push({
          name: fileName,
          templateString: _templateString,
          bootstrapData: bootstrapData
        });

      } 
    }
  });

  let routes = [...baseRoutes, ...usernameRoutes];

  return { routes, partials };

}

let projectInfo = _getProjectInfo();

let getRoutes = function () {
  return JSON.parse(JSON.stringify(projectInfo.routes));
}

let getPartials = function () {
  return JSON.parse(JSON.stringify(projectInfo.partials));
}

export {
  getRoutes,
  getPartials
};




