import { getDataFromRootNode, getDataFromNode } from "../outputjs";
import { ajaxPost } from '../hummingbird/lib/ajax';

let onSaveFunctions = {
  // default save function posts data to /save endpoint
  all: function (data) {
    ajaxPost("/save", {data}, function (res) {});
  }
};

export function initSaveFunctions (saveFunctions) {
  Object.assign(onSaveFunctions, saveFunctions);
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
  // allow alternate names: use `elementDataWasSyncedInto` when syncing, user `targetElement` when creating new data or removing data
  elementDataWasSyncedInto = elementDataWasSyncedInto || targetElement;
  let saveElement = elementDataWasSyncedInto.closest("[data-o-save-deep], [data-o-save]");
    
  if (saveElement) {
    let shouldParseChildElements = saveElement.matches("[data-o-save-deep]");

    if (shouldParseChildElements) {
      let saveType = saveElement.getAttribute("data-o-save-deep");
      let saveFunc = onSaveFunctions[saveType];

      if (saveFunc) {
        let dataFromSaveElement = getDataFromRootNode(saveElement);
        saveFunc(dataFromSaveElement, elementDataWasSyncedInto);
      }
    } else {
      let saveType = saveElement.getAttribute("data-o-save");
      let saveFunc = onSaveFunctions[saveType];

      if (saveFunc) {
        let dataFromSaveElement = getDataFromNode(saveElement);
        saveFunc(dataFromSaveElement, elementDataWasSyncedInto);
      }
    }
  }
}




