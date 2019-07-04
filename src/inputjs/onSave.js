import { getDataFromRootNode, getDataFromNode } from "../outputjs";
import { ajaxPost } from '../hummingbird/lib/ajax';
import { getAttributeValueAsArray } from '../parse-data-attributes';

let saveFunctionsLookup = {
  // default save function posts data to /save endpoint
  defaultSave: function ({data, path, saveToId, elem}) {
    ajaxPost("/save", {data, path, saveToId}, function (res) {});
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

export function callSaveFunction ({elementDataWasSyncedInto, targetElement}) {
  // allow two different params that do the same things to be passed into this function: 
  // use `elementDataWasSyncedInto` when syncing, user `targetElement` when creating new data or removing data
  elementDataWasSyncedInto = elementDataWasSyncedInto || targetElement;
  let saveElement = elementDataWasSyncedInto.closest("[data-o-save-deep], [data-o-save]");
    
  if (saveElement) {
    let isDataInsideElem = saveElement.matches("[data-o-save-deep]");
    let [ saveFuncName, savePath, saveToId ] = getSaveFuncInfo(saveElement, isDataInsideElem);

    let saveFunc = saveFunctionsLookup[saveFuncName];

    if (saveFunc) {
      let dataFromSaveElement = isDataInsideElem ? getDataFromRootNode(saveElement) : getDataFromNode(saveElement);
      saveFunc({data: dataFromSaveElement, elem: elementDataWasSyncedInto, path: savePath, saveToId});
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










