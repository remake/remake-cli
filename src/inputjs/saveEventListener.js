import { $ } from '../queryjs';
import { syncDataBetweenElements, triggerSyncAndSave } from "./syncData";

// IMPORTANT: PREFER USING THIS OVER THE "CLICK TO SAVE" IF THE DATA CAN BE PLACED IN AN INLINE EDIT FORM
export function initSaveEventListener () {

  // 1. watch for when a form with `data-i-sync` on it is submitted, either by pressing a `data-i-save` button or maybe by pressing enter in an input
  $.on("submit", "[data-i-sync]", triggerSyncAndSave);

  $.on("click", "[data-i-sync] [data-i-trigger-sync]", triggerSyncAndSave);

}













