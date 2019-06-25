import { getDataFromRootNode, getDataFromNode } from "../outputjs";
import { ajaxPost } from '../hummingbird/lib/ajax';
import { getAttributeValueAsArray } from '../parse-data-attributes';

let saveFunctionsLookup = {
  // default save function posts data to /save endpoint
  defaultSave: function ({data, path, elem}) {
    ajaxPost("/save", {data, path}, function (res) {});
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
    let [ saveFuncName, savePath ] = getSaveFuncNameAndPath(saveElement, isDataInsideElem);

    let saveFunc = saveFunctionsLookup[saveFuncName];

    if (saveFunc) {
      let dataFromSaveElement = isDataInsideElem ? getDataFromRootNode(saveElement) : getDataFromNode(saveElement);
      saveFunc({data: dataFromSaveElement, elem: elementDataWasSyncedInto, path: savePath});
    }
  }
}

function getSaveFuncNameAndPath (saveElement, isDataInsideElem) {
  let dashCaseAttrName = isDataInsideElem ? "data-o-save-deep" : "data-o-save";
  let [ funcName, savePath ] = getAttributeValueAsArray(saveElement, dashCaseAttrName);
  return [ funcName, savePath && savePath.substring(5) ]; // remove "path:" from the savePath
}




