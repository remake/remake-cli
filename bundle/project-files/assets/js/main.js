import { init, getDataFromRootNode } from 'remakejs/dist/bundle.es6';
import crostini from 'crostini';

init({
  logDataOnSave: true, // to implement. should console.log data on page whenever it changes.
  defaultSaveCallback: function (res) {
    if (!res.success) {
      crostini("Error saving data", {type: "error"});
    }
  },
  addItemCallback: function ({templateName, ajaxResponse}) {
    if (!ajaxResponse.success) {
      crostini("Error adding new item", {type: "error"});
    }
  }
});

// for debugging
window.getDataFromRootNode = getDataFromRootNode;