function isBaseRoute (params) {
  return !params.id && !params.username;
}
function isUsernameRoute (params) {
  return !!params.username;
}
function isItemRoute (params) {
  return !!params.id;
}

export default {
  isBaseRoute,
  isUsernameRoute,
  isItemRoute
}