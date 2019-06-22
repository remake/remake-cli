import initInboundDataSyncEventListener from './inboundDataSyncEventListener';
import { initSaveEventListener } from './saveEventListener';
import { initRemoveAndHideEventListeners } from './removeAndHideEventListeners';
import initChoiceEventListener from './choiceEventListener';
import initInputElementEventListener from './inputElementEventListener';
import initClickToSaveEventListener from './clickToSaveEventListener';
import { callMultipleWatchFunctions, getValueAndDataSourceElemFromKeyName } from './watchHelpers';
import { afterSync } from "./syncData";
import optionsData from './optionsData';
import { enableSaveAttribute, initSaveFunctions, callSaveFunction } from './onSave';
import initEditableAttribute from './editableAttribute';
import initAddingItemEventListener from './addingItemEventListener';
import { merge } from 'lodash-es';

function initInputEventListeners (options) {
  merge(optionsData, options);
  
  enableSaveAttribute(afterSync);
  initInboundDataSyncEventListener();
  initSaveEventListener();
  initRemoveAndHideEventListeners();
  initChoiceEventListener();
  initInputElementEventListener();
  initClickToSaveEventListener();
  initEditableAttribute();
  initAddingItemEventListener();
}

export {
  initInputEventListeners,
  initSaveFunctions,
  callSaveFunction,
  callMultipleWatchFunctions,
  getValueAndDataSourceElemFromKeyName
}





