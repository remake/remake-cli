const Handlebars = require('handlebars');
const parseUrl = require('parseurl');
import { get, set, isPlainObject } from 'lodash-es';
import forEachDeep from "deepdash-es/forEachDeep";
import { getItemWithId } from "./get-item-with-id";
import { specialDeepExtend } from "./special-deep-extend";
import getUniqueId from "./get-unique-id";
import { getUserData, setUserData } from "./user-data";
import { getPartials } from "./get-project-info";
import { getParamsFromPathname } from "../utils/get-params-from-pathname";
import { preProcessData } from "./pre-process-data";


export function initApiRoutes ({app}) {
  let partials = getPartials();

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
        specialDeepExtend(itemData, incomingData);
        Object.assign(itemData, incomingData);
      // option 3: extend existing data at root level
      } else {
        specialDeepExtend(existingData, incomingData);
        existingData = incomingData;
      }

      await setUserData({username: currentUser.details.username, data: existingData, type: "appData"});

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
    let matchingPartial = partials.find(partial => partial.name === templateName);

    // add a unique key to every plain object in the bootstrap data
    forEachDeep(matchingPartial.bootstrapData, function (value, key, parentValue, context) {
      if (isPlainObject(value) && !value.id) {
        value.id = getUniqueId();
      }
    });

    // referrer url
    let referrerUrl = req.get('Referrer'); // e.g. "http://exampleapp.org/jane/todo-list/123"
    let referrerUrlParsed = new URL(referrerUrl);
    let referrerUrlPath = referrerUrlParsed.pathname; // e.g. "/jane/todo-list/123"
    let params = getParamsFromPathname(referrerUrlPath); // e.g. { username: 'jane', id: '123' }
    let query = Object.fromEntries(referrerUrlParsed.searchParams);

    let usernameFromParams = params.username;
    let pathname = referrerUrlPath;
    let currentUser = req.user;
    let pageAuthor = await getUserData({username: usernameFromParams});
    let data = pageAuthor && pageAuthor.appData || {};
    let isPageAuthor = currentUser && pageAuthor && currentUser.details.username === pageAuthor.details.username;

    if (!isPageAuthor) {
      res.json({success: false, reason: "notAuthorized"});
      return;
    }

    let currentItem;
    let parentItem; 
    if (pageAuthor) {
      let processResponse = await preProcessData({data, user: pageAuthor, params, addUniqueIdsToData: true});
      currentItem = processResponse.currentItem;
      parentItem = processResponse.parentItem;
    }

    if (usernameFromParams && !pageAuthor) {
      res.json({success: false, reason: "notAuthorized"});
      return;
    }

    let template = Handlebars.compile(matchingPartial.templateString);
    let htmlString = template({
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
      ...matchingPartial.bootstrapData
    });

    res.json({success: true, htmlString: htmlString});
  })

}





