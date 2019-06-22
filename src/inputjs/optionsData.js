let elemProps = ["id", "className", "type", "src", "value", "checked", "innerText", "innerHTML", "style", "title", "alt", "for", "placeholder"];

export default {
  // default watch functions
  watchFunctions: {
    "*": function ({watchElem, watchAttrName, camelCaseKeyName, value, dataSourceElem, watchFuncName, watchFuncArgs, dataTargetElem}) {
      // if func is a valid property, set the first arg as its value
      if (elemProps.includes(watchFuncName)) {
        watchElem[watchFuncName] = value;
      }

      // if func is a data attribute, set the first arg as its value
      if (watchFuncName.startsWith("data-")) {
        watchElem.setAttribute(watchFuncName, value);
      }
    }
  }
};