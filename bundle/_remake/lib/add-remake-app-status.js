import routeUtils from "../utils/route-utils";

export function addRemakeAppStatusToPage ({html, currentUser, params}) {
  let attributeString = createBodyAttributeString({currentUser, params});
  return html.replace("<body", attributeString);
}

function createBodyAttributeString ({currentUser, params}) {
  let str = "<body ";

  if (currentUser) {
    str += "data-user-logged-in ";
  } else {
    str += "data-user-not-logged-in ";
  }

  if (routeUtils.isBaseRoute(params)) {
    str += "data-base-route ";
  }

  if (routeUtils.isUsernameRoute(params)) {
    str += "data-username-route ";
  }

  if (routeUtils.isItemRoute(params)) {
    str += `data-item-route="${params.id}" `;
  }

  return str;
}