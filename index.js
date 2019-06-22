import { $ } from './src/remakejs/queryjs';

import { copyLayout } from './src/remakejs/copy-layout';

import Switches from './remakejs/switchjs';

import { 
  initInputEventListeners,
  initSaveFunctions,
  callSaveFunction,
  callMultipleWatchFunctions,
  getValueAndDataSourceElemFromKeyName
} from './src/remakejs/inputjs';

import { 
  getDataFromRootNode,
  setLocationKeyValue,
  getLocationKeyValue,
  setValueForKeyName,
  getDataFromNode,
  getDataAndDataSourceElemFromNodeAndAncestors 
} from './src/remakejs/outputjs';

export default {
  init: initInputEventListeners,
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













