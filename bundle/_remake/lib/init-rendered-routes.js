const Handlebars = require('handlebars');
const parseUrl = require('parseurl');
import { getRoutes, getPartials } from "./get-project-info";
const path = require('upath');
const jsonfile = require("jsonfile");
import { preProcessData } from "./pre-process-data";
import { getUserData } from "./user-data";
import { initCustomHandlebarsHelpers } from "./init-custom-handlebars-helpers";
import { capture } from "../utils/async-utils";
import { addRemakeAppStatusToPage } from "./add-remake-app-status";

// USER-DEFINED PARTIALS
let partials = getPartials();
partials.forEach(partial => Handlebars.registerPartial(partial.name, partial.templateString));

// CUSTOM HELPERS
initCustomHandlebarsHelpers({Handlebars, });


export async function initRenderedRoutes ({ app }) {

  let routes = getRoutes();

  routes.forEach(({route, templateString}) => {

    app.get(route, async (req, res) => { // route === "/:username/page-name-route/:id?"

      let params = req.params;
      let usernameFromParams = params.username;
      let query = req.query;
      let pathname = parseUrl(req).pathname;
      let currentUser = req.user;

      let [pageAuthor, pageAuthorError] = await capture(getUserData({username: usernameFromParams}));
      if (pageAuthorError) {
        res.status(500).send("500 Server Error");
        return;
      }

      let data = pageAuthor && pageAuthor.appData;
      let isPageAuthor = currentUser && pageAuthor && currentUser.details.username === pageAuthor.details.username;
      let flashErrors = req.flash("error");

      let currentItem;
      let parentItem; 
      if (pageAuthor) {
        // add unique ids to data
        let [processResponse, processResponseError] = await capture(preProcessData({data, user: pageAuthor, params, addUniqueIdsToData: true}));
        if (processResponseError) {
          res.status(500).send("500 Server Error");
          return;
        }

        currentItem = processResponse.currentItem;
        parentItem = processResponse.parentItem;
      }

      if (usernameFromParams && !pageAuthor) {
        // could redirect from the current page, i.e. /:username/pageName to the static route, i.e. /pageName
        res.status(404).send("404 Not Found");
        return;
      }

      if (params.id && !currentItem) {
        res.status(404).send("404 Not Found");
        return;
      }

      let template = Handlebars.compile(templateString);
      let html = template({
        data,
        params,
        query,
        pathname,
        currentItem,
        parentItem,
        flashErrors,
        currentUser,
        pageAuthor,
        isPageAuthor,
        pageHasAppData: !!pageAuthor
      });

      html = addRemakeAppStatusToPage({html, currentUser, params});

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(html);

    });

  });

}







