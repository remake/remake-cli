import { $ } from './queryjs';

import { copyLayout } from './copy-layout';

import Switches from './switchjs';

import { 
  initInputEventListeners,
  initSaveFunctions,
  callSaveFunction,
  callMultipleWatchFunctions,
  getValueAndDataSourceElemFromKeyName
} from './inputjs';

import { 
  getDataFromRootNode,
  setLocationKeyValue,
  getLocationKeyValue,
  setValueForKeyName,
  getDataFromNode,
  getDataAndDataSourceElemFromNodeAndAncestors 
} from './outputjs';

let init = initInputEventListeners;

export default {
  init,
  $,
  copyLayout,
  Switches,
  initInputEventListeners,
  initSaveFunctions,
  callSaveFunction,
  callMultipleWatchFunctions,
  getValueAndDataSourceElemFromKeyName,
  getDataFromRootNode,
  setLocationKeyValue,
  getLocationKeyValue,
  setValueForKeyName,
  getDataFromNode,
  getDataAndDataSourceElemFromNodeAndAncestors 
}

