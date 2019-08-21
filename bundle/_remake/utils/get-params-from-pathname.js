import { getRoutes } from "../lib/get-project-info";
var pathMatch = require('path-match')({});

export function getParamsFromPathname (pathname) {
  let routes = getRoutes();

  for (var i = 0; i < routes.length; i++) {
    let routeObj = routes[i];
    let route = routeObj && routeObj.route; // e.g. "/:username/todo-list/:id?"

    let match = pathMatch(route);
    let params = match(pathname);

    if (params) {
      return params;
    }
  }
}