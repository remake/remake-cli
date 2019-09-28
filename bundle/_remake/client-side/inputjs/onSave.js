import { $ } from '../queryjs';
import { getDataFromRootNode, getDataFromNode } from "../outputjs";
import { ajaxPost } from '../hummingbird/lib/ajax';
import { getAttributeValueAsArray } from '../parse-data-attributes';
import optionsData from './optionsData';

let saveFunctionsLookup = {
  // default save function posts data to /save endpoint
  defaultSave: function ({data, path, saveToId, elem}) {
    ajaxPost("/save", {data, path, saveToId}, function (res) {
      if (optionsData.defaultSaveCallback) {
        optionsData.defaultSaveCallback(res);
      }
    });
  }
};

export function initSaveFunctions (saveFunctions) {
  Object.assign(saveFunctionsLookup, saveFunctions);
}

export function enableSaveAttribute (afterSync) {
  afterSync(function ({elementsDataWasSyncedInto, targetElement, shouldTriggerSave}) {
    if (shouldTriggerSave) {
      elementsDataWasSyncedInto.forEach((elementDataWasSyncedInto) => {
        callSaveFunction({elementDataWasSyncedInto});
      });
    }
  });
}

// all saves go through here
export function callSaveFunction ({elementDataWasSyncedInto, targetElement}) {
  // allow two different params that do the same thing to be passed into this function: 
  // use `elementDataWasSyncedInto` when syncing, user `targetElement` when creating or removing data
  elementDataWasSyncedInto = elementDataWasSyncedInto || targetElement;
  
  // get the save element, which is the closest element with a save attribute
  let saveElement = elementDataWasSyncedInto.closest("[data-o-save-deep], [data-o-save], [data-o-key-id]");
  
  // if there's no save element, use the body element
  let isDefaultingToDataKeyIdSave = false;
  let isDefaultingToGlobalSave = false;
  if (!saveElement) {
    saveElement = document.body;
    isDefaultingToGlobalSave = true;
  } else if (saveElement.matches("[data-o-key-id]") && !saveElement.matches("[data-o-save-deep], [data-o-save]")) {
    isDefaultingToDataKeyIdSave = true;
  }

  if (saveElement) {

    // detect if this is a shallow or a deep save?
    let isDataInsideElem = isDefaultingToGlobalSave || isDefaultingToDataKeyIdSave || saveElement.matches("[data-o-save-deep]");

    // get all the info we need to save this data
    let saveFuncName, savePath, saveToId;
    if (isDefaultingToGlobalSave) {
      saveFuncName = "defaultSave";
    } else if (isDefaultingToDataKeyIdSave) {
      saveFuncName = "defaultSave";
      saveToId = saveElement.getAttribute("data-o-key-id");
    } else {
      [ saveFuncName, savePath, saveToId ] = getSaveFuncInfo(saveElement, isDataInsideElem);
    }

    let saveFunc = saveFunctionsLookup[saveFuncName];

    // if there's a save function, continue
    if (saveFunc) {
      // get the data differently depending on if it's a shallow or deep save
      let dataFromSaveElement = isDataInsideElem ? getDataFromRootNode(saveElement) : getDataFromNode(saveElement);

      // save the data
      saveFunc({data: dataFromSaveElement, elem: elementDataWasSyncedInto, path: savePath, saveToId});

      // show a warning if you think the save might be a mistakes
      let idInRoute = document.body.getAttribute("data-item-route");
      let matchingIdKeyElem = document.querySelector(`[data-o-key-id="${idInRoute}"]`);
      if (isDefaultingToGlobalSave && idInRoute && !matchingIdKeyElem) {
        console.log(`%cWarning: No element on this page has a data-o-key-id attribute that matches the id defined by the route (id: ${idInRoute}). This means the page's data will not be saved to an id.`, "color: #e03131;");
      }

      // log the data if this debug option is turned on
      if (optionsData.logDataOnSave) {
        console.log("# logDataOnSave");
        console.log("Data:", dataFromSaveElement);

        let saveMethod = (isDefaultingToGlobalSave) 
                          ? "Saved entire page" 
                          : (isDefaultingToDataKeyIdSave) 
                          ? `Saved to nearest id: ${saveToId}`
                          : `Saved to nearest save function: ${saveFuncName}`;

        console.log("Save method:", saveMethod);

        if (savePath) {
          console.log("Save to path:", savePath);
        }

        // explicit save to id
        if (!isDefaultingToDataKeyIdSave && saveToId) {
          console.log("Save to id:", saveToId);
        }
      }
    }
  }
}

export function getSaveFuncInfo (saveElement, isDataInsideElem) {
  let dashCaseAttrName = isDataInsideElem ? "data-o-save-deep" : "data-o-save";
  let args = getAttributeValueAsArray(saveElement, dashCaseAttrName);

  let funcName, savePath, saveToId;
  args.forEach((arg) => {
    if (arg.startsWith("path:")) {
      savePath = arg.substring(5);
    } else if (arg.startsWith("id:")) {
      saveToId = arg.substring(3);
    } else {
      funcName = arg;
    }
  });

  funcName = funcName || "defaultSave";

  return [ funcName, savePath, saveToId ]; 
}










