const Handlebars = require('handlebars');
const parseUrl = require('parseurl');
import { get, set, isPlainObject } from 'lodash-es';
import forEachDeep from "deepdash-es/forEachDeep";
import { getItemWithId } from "./get-item-with-id";
import { specialDeepExtend } from "./special-deep-extend";
import getUniqueId from "./get-unique-id";
import { getUserData, setUserData } from "./user-data";
import { getPartials, getBootstrapData } from "./get-project-info";
import { getParamsFromPathname } from "../utils/get-params-from-pathname";
import { capture } from "../utils/async-utils";
import { preProcessData } from "./pre-process-data";
import RemakeStore from "./remake-store";


export function initApiRoutes ({app}) {

  app.post('/save', async (req, res) => {

    if (!req.isAuthenticated()) {
      res.json({success: false, reason: "notAuthorized"});
      return;
    }

    // referrer url
    let referrerUrl = req.get('Referrer'); // e.g. "http://exampleapp.org/jane/todo-list/123"
    let referrerUrlParsed = new URL(referrerUrl);
    let referrerUrlPath = referrerUrlParsed.pathname; // e.g. "/jane/todo-list/123"
    let params = getParamsFromPathname(referrerUrlPath); // e.g. { username: 'jane', id: '123' }
    let usernameFromParams = params.username;

    // get incoming data
    let incomingData = req.body.data;
    let savePath = req.body.path;
    let saveToId = req.body.saveToId;

    if (!incomingData) {
      res.json({success: false, reason: "noIncomingData"});
      return;
    }

    // get existing data
    let currentUser = req.user;
    let isPageAuthor = currentUser && usernameFromParams && currentUser.details.username === usernameFromParams;
    let existingData = currentUser.appData;

    if (isPageAuthor) {
      // option 1: save path
      if (savePath) {
        let dataAtPath = get(existingData, savePath); 

        if (isPlainObject(dataAtPath)) {
          // deep extend, using ids to match objects in arrays
          specialDeepExtend(dataAtPath, incomingData);
          set(existingData, savePath, incomingData);
        } else if (Array.isArray(dataAtPath)) {
          specialDeepExtend(dataAtPath, incomingData);
          set(existingData, savePath, incomingData);
        } else {
          // if we're not auto generating ids OR
          // if dataAtPath is NOT an object or array
          // replace the data the the path
          set(existingData, savePath, incomingData);
        }
      // option 2: save to id
      } else if (saveToId) {
        let itemData = getItemWithId(existingData, saveToId);

        if (!itemData) {
          res.json({success: false, reason: "noItemFound"});
          return;
        }

        specialDeepExtend(itemData, incomingData);
        Object.assign(itemData, incomingData);
      // option 3: extend existing data at root level
      } else {
        specialDeepExtend(existingData, incomingData);
        existingData = incomingData;
      }

      let [setUserDataResponse, setUserDataError] = await capture(setUserData({username: currentUser.details.username, data: existingData, type: "appData"}));
      if (setUserDataError) {
        res.json({success: false, reason: "userData"});
        return;
      }

      res.json({success: true});

    } else {
      res.json({success: false, reason: "notAuthorized"});
      return;
    }

  })

  app.post('/new', async (req, res) => {

    if (!req.isAuthenticated()) {
      res.json({success: false, reason: "notAuthorized"});
      return;
    }

    let templateName = req.body.templateName;
    
    // get the partials data every time so it returns a new (copied!) object and you don't mistakenly use a modified object from the previous call
    let partials = getPartials();
    let matchingPartial = partials.find(partial => partial.name === templateName);

    // default to using inline named partials as opposed to partial files
    let templateRenderFunc = RemakeStore.getNewItemRenderFunction({name: templateName});
    let bootstrapData = getBootstrapData().partials[templateName] || {};

    // use the user-defined partial files only if no render functions are found
    if (!templateRenderFunc) {
      templateRenderFunc = Handlebars.compile(matchingPartial.templateString);
    }

    // add a unique key to every plain object in the bootstrap data
    forEachDeep(bootstrapData, function (value, key, parentValue, context) {
      if (isPlainObject(value)) {
        value.id = getUniqueId();
      }
    });

    // construct referrer url, pathname, params, and query object from referrer url
    let referrerUrl = req.get('Referrer'); // e.g. "http://exampleapp.org/jane/todo-list/123"
    let referrerUrlParsed = new URL(referrerUrl);
    let referrerUrlPath = referrerUrlParsed.pathname; // e.g. "/jane/todo-list/123"
    let params = getParamsFromPathname(referrerUrlPath); // e.g. { username: 'jane', id: '123' }
    let query = Object.fromEntries(referrerUrlParsed.searchParams);

    let usernameFromParams = params.username;
    let pathname = referrerUrlPath;
    let currentUser = req.user;
    let [pageAuthor, pageAuthorError] = await capture(getUserData({username: usernameFromParams}));

    if (pageAuthorError) {
      res.json({success: false, reason: "userData"});
      return;
    }

    let data = pageAuthor && pageAuthor.appData || {};
    let isPageAuthor = currentUser && pageAuthor && currentUser.details.username === pageAuthor.details.username;

    if (!isPageAuthor) {
      res.json({success: false, reason: "notAuthorized"});
      return;
    }

    let currentItem;
    let parentItem; 
    if (pageAuthor) {
      let [processResponse, processResponseError] = await capture(preProcessData({data, user: pageAuthor, params, addUniqueIdsToData: true}));
      if (processResponseError) {
        res.json({success: false, reason: "preProcessData"});
        return;
      }

      currentItem = processResponse.currentItem;
      parentItem = processResponse.parentItem;
    }

    if (usernameFromParams && !pageAuthor) {
      res.json({success: false, reason: "notAuthorized"});
      return;
    }

    let htmlString = templateRenderFunc({
      data,
      params,
      query,
      pathname,
      currentItem,
      parentItem,
      currentUser,
      pageAuthor,
      isPageAuthor,
      pageHasAppData: !!pageAuthor,
      ...bootstrapData
    });

    res.json({success: true, htmlString: htmlString});
  })

}





