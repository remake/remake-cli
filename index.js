import { $ } from './src/queryjs';

import { copyLayout } from './src/copy-layout';

import Switches from './src/switchjs';

import { 
  initInputEventListeners,
  initSaveFunctions,
  callSaveFunction,
  callMultipleWatchFunctions,
  getValueAndDataSourceElemFromKeyName
} from './src/inputjs';

import { 
  getDataFromRootNode,
  setLocationKeyValue,
  getLocationKeyValue,
  setValueForKeyName,
  getDataFromNode,
  getDataAndDataSourceElemFromNodeAndAncestors 
} from './src/outputjs';

let init = initInputEventListeners;

export {
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













