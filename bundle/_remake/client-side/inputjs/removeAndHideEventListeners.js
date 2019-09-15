import { $ } from '../queryjs';
import { callSaveFunction } from './onSave';
import { forEachAttr } from '../hummingbird/lib/dom';
import { triggerSyncAndSave, syncDataBetweenElements } from "./syncData";
import { setAllDataToEmptyStringsExceptIds } from "../outputjs";

export function initRemoveAndHideEventListeners () {

  // useful for permanently removing items, especially from a list of similar items
  $.on("click", "[data-i-remove]", function (event) {

    // 1. find the nearest ancestor element that has the attribute `data-i-sync`
    let syncElement = event.currentTarget.closest("[data-i-sync]");

    // 2. get the closest element with data on it
    let sourceElement;
    if (syncElement) {
      // handle the case where we're in an editable popover
      sourceElement = $.data(syncElement, "source");
    } else {
      // handle the case where we're clicking a "remove" button on the page
      sourceElement = event.currentTarget;
    }

    let elemWithData = sourceElement.closest('[data-o-type="object"]');

    // 3. get parent element (because we can't call the save function on an elem that doesn't exist)
    let parentElem = elemWithData.parentNode;

    // 4. remove the data element
    elemWithData.remove();

    // 5. save data
    callSaveFunction({targetElement: parentElem});

  });

  // useful for hiding items the user doesn't want visible, but allowing them to add them back later
  $.on("click", "[data-i-hide]", function (event) {

    // 1. find the nearest ancestor element that has the attribute `data-i-sync`
    let syncElement = event.currentTarget.closest("[data-i-sync]");

    if (syncElement) {
      // 2.a. look through the data keys and set ALL their values to empty strings
      setAllDataToEmptyStringsExceptIds(syncElement);
      // 3.a. save all the data as empty strings
      triggerSyncAndSave(event);
    } else {
      // 2.b. look through the data keys and set ALL their values to empty strings
      let elemWithData = event.currentTarget.closest('[data-o-type="object"]');
      setAllDataToEmptyStringsExceptIds(elemWithData);

      // This is a little hacky: syncing data from an element back into itself. However,
      // it takes care of a lot of things for us, like getting the data, making sure we respect
      // default data, calling watch functions, and triggering a save, so it's worth it.
      syncDataBetweenElements({sourceElement: elemWithData, targetElement: elemWithData, shouldTriggerSave: true});
    }

  });

}




