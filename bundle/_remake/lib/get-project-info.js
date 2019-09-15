const dirTree = require("directory-tree");
const tree = dirTree("./project-files", {
  extensions: /\.(hbs|json)$/
});
const util = require("util");
const fs = require("fs");
const path = require("upath");
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
  let bootstrapData = {user: {details: {}, appData: {}}, partials: {}};

  forEachDeep(tree, function (value, key, parent, context) {

    let fileNameWithoutExtension; 
    let currentFilePath;
    if (value.name) {
      fileNameWithoutExtension = value.name.replace(value.extension, ""); // e.g. "todos"
    }
    if (value.path) {
      currentFilePath = path.join(__dirname, "../../", value.path); // e.g. "../../project-files/pages/todos.hbs"
    }

    if (value.extension === ".hbs") {
      let _templateString = fs.readFileSync(currentFilePath, "utf8"); 

      // check if we're in the /pages directory
      if (currentFilePath.includes("/pages/")) {

        // find the current page's layout (either explicitly named or the "default" layout)
        let layoutNameMatch = _templateString.match(layoutNameRegex);
        let layoutName = layoutNameMatch ? layoutNameMatch[1] : "default";

        // remove the special "layout" command from the page template
        let templateStringCleaned = _templateString.replace(layoutNameRegex, "");

        // insert the page template into its layout
        let layoutTemplateString = fs.readFileSync(path.join(__dirname, `../../project-files/layouts/${layoutName}.hbs`), "utf8");
        let templateString = layoutTemplateString.replace(yieldCommandRegex, templateStringCleaned);

        // create the base route (these need to render BEFORE dynamic :username routes)
        let baseRoute = fileNameWithoutExtension === "index" ? "/" : `/${fileNameWithoutExtension}`; // e.g. /todos
        // create the dynamic username route
        let usernameRoute = fileNameWithoutExtension === "index" ? "/:username" : `/:username/${fileNameWithoutExtension}/:id?`; // e.g. /john/todos/123


        baseRoutes.push({
          route: baseRoute,
          templateString
        });

        usernameRoutes.push({
          route: usernameRoute,
          templateString
        });

      } else if (currentFilePath.includes("/partials/")) {

        partials.push({
          name: fileNameWithoutExtension,
          templateString: _templateString
        });

      }

    } else if (value.extension === ".json" && currentFilePath.includes("/_bootstrap-data/")) {

        let bootstrapDataForCurrentFile;
        try {
          bootstrapDataForCurrentFile = jsonfile.readFileSync(currentFilePath);
        } catch (e) {
          bootstrapDataForCurrentFile = {};
        }

        if (currentFilePath.includes("/partials/")) {

          bootstrapData.partials[fileNameWithoutExtension] = bootstrapDataForCurrentFile;

        } else if (currentFilePath.includes("/user/")) {

          if (fileNameWithoutExtension === "appData" || fileNameWithoutExtension === "details") {

            bootstrapData.user[fileNameWithoutExtension] = bootstrapDataForCurrentFile;

          }

        }

    }

  });

  let routes = [...baseRoutes, ...usernameRoutes];

  return { routes, partials, bootstrapData };

}

let projectInfo = _getProjectInfo();

let getRoutes = function () {
  return JSON.parse(JSON.stringify(projectInfo.routes));
}

let getPartials = function () {
  return JSON.parse(JSON.stringify(projectInfo.partials));
}

let getBootstrapData = function () {
  return JSON.parse(JSON.stringify(projectInfo.bootstrapData));
}

export {
  getRoutes,
  getPartials,
  getBootstrapData
};




