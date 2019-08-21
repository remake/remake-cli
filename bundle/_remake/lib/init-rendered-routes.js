const Handlebars = require('handlebars');
const parseUrl = require('parseurl');
import { getRoutes, getPartials } from "./get-project-info";
const path = require('path');
const jsonfile = require("jsonfile");
import { preProcessData } from "./pre-process-data";
import { getUserData } from "./user-data";

let partials = getPartials();
partials.forEach(partial => Handlebars.registerPartial(partial.name, partial.templateString));

export async function initRenderedRoutes ({ app }) {

  let routes = getRoutes();

  routes.forEach(({route, templateString}) => {

    app.get(route, async (req, res) => { // route === "/:username/page-name-route/:id?"

      let params = req.params;
      let usernameFromParams = params.username;
      let query = req.query;
      let pathname = parseUrl(req).pathname;
      let currentUser = req.user;
      let pageAuthor = await getUserData({username: usernameFromParams});
      let data = pageAuthor && pageAuthor.appData;
      let isPageAuthor = currentUser && pageAuthor && currentUser.details.username === pageAuthor.details.username;
      let flashErrors = req.flash("error");

      let currentItem;
      let parentItem; 
      if (pageAuthor) {
        let processResponse = await preProcessData({data, user: pageAuthor, params, addUniqueIdsToData: true});
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

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(html);

    });

  });

}







