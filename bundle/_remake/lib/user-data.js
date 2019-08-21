const jsonfile = require("jsonfile");
const path = require('path');
import { showConsoleError } from "../utils/console-utils";

// create new user data files
// returns: {details, appData}
async function createUserData ({ username, hash }) {

  let details;
  try {
    details = await jsonfile.readFile(path.join(__dirname, "../../project-files/_bootstrap-data/user/details.json"));
  } catch (e) {
    details = {};
  }

  // extend user details with args
  Object.assign(details, { username, hash });

  let appData;
  try {
    appData = await jsonfile.readFile(path.join(__dirname, "../../project-files/_bootstrap-data/user/appData.json"));
  } catch (e) {
    appData = {};
  }

  let detailsWritePromise = jsonfile.writeFile(path.join(__dirname, "../../_remake-data/user-details/", `${username}.json`), details, { spaces: 2 });
  let appDataWritePromise = jsonfile.writeFile(path.join(__dirname, "../../_remake-data/user-app-data/", `${username}.json`), appData, { spaces: 2 });

  await Promise.all([detailsWritePromise, appDataWritePromise]);

  return {details, appData};
}

// get all user data
// returns: {details, appData}
async function getUserData ({ username }) {
  try {
    let detailsPromise = jsonfile.readFile(path.join(__dirname, "../../", "_remake-data/user-details/", `${username}.json`)); 
    let appDataPromise = jsonfile.readFile(path.join(__dirname, "../../", "_remake-data/user-app-data/", `${username}.json`));
    let [ details, appData ] = await Promise.all([detailsPromise, appDataPromise]);
    return { details, appData }; 
  } catch (e) {
    return null;
  }
}

// set EITHER details data OR appData data by username
// returns: {username, type, data}
async function setUserData ({ username, data, type }) {
  let detailsWritePromise;
  let appDataWritePromise;

  try {
    if (type === "details") {
      detailsWritePromise = jsonfile.writeFile(path.join(__dirname, "../../", "_remake-data/user-details/", `${username}.json`), data, { spaces: 2 });
    }
  } catch (e) {
    showConsoleError("Error: Setting user details");
  }

  try {
    if (type === "appData") {
      appDataWritePromise = jsonfile.writeFile(path.join(__dirname, "../../", "_remake-data/user-app-data/", `${username}.json`), data, { spaces: 2 });
    }
  } catch (e) {
    showConsoleError("Error: Setting user appData");
  }

  await Promise.all([detailsWritePromise, appDataWritePromise]);

  return {username, type, data};
}

export {
  createUserData,
  getUserData,
  setUserData
}