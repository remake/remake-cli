import { forEachAttr, forEachAncestorMatch } from '../hummingbird/lib/dom';
import { dashToCamelCase, camelCaseToDash } from '../hummingbird/lib/string';
import { formatSpaces } from "../parse-data-attributes";

// example return value:
// {elemType: "object", key: "profileInfo", value: {name: "Kate"}}
function parseNode (elem, isParentDataAnObject) { 
  let elemType = elem.getAttribute("data-o-type"); // elemType can be `object` or `list`

  return {
    elemType: elemType,
    key: isParentDataAnObject ? elem.getAttribute("data-o-key") : null,
    value: elemType === "list" ? [] : getDataFromNode(elem)
  };
}

// Converts:
// <div data-o-key-example-one="1" data-o-key-example-two="2"></div>
// Into:
// {exampleOne: "1", exampleTwo: "2"}
function getDataFromNode (elem) {
  let keyPrefix = "data-o-key-";
  let locationKeyPrefix = "data-l-key-";
  let keyPrefixLength = keyPrefix.length;

  let returnObj = {};

  forEachAttr(elem, (attrName, attrValue) => {
    if (attrName.indexOf(keyPrefix) === 0) {

      let keyName = attrName.substring(keyPrefixLength);
      let camelCaseKeyName = dashToCamelCase(keyName);

      returnObj[camelCaseKeyName] = attrValue;
      
    } else if (attrName.indexOf(locationKeyPrefix) === 0) {

      let keyName = attrName.substring(keyPrefixLength);
      let camelCaseKeyName = dashToCamelCase(keyName);
      
      attrValue = getLocationKeyValue(elem, keyName, attrValue);
      returnObj[camelCaseKeyName] = attrValue;

    }
  });

  return returnObj;
}

// Used by syncData.js to get all data on or above an element, so it can be synced into 
// another element.
// 1. Find the CLOSEST `[data-o-type="object"]`
// 2. Get this element's data keys and their values
// 3. Add these key/values into an object (lower/earlier keys always overwrite higher ones)
// 4. Start again at (a) until it returns null and you have a full object
function getDataAndDataSourceElemFromNodeAndAncestors (elem) {
  let collectedData = {};
  let selector = '[data-o-type="object"]';

  forEachAncestorMatch({
    elem: elem,
    selector: selector, 
    callback: function (matchingElem) {
      let nodeData = getDataFromNode(matchingElem);

      // add source element
      Object.keys(nodeData).forEach((camelCaseKeyName) => {
        let value = nodeData[camelCaseKeyName];
        nodeData[camelCaseKeyName] = {value, dataSourceElem: matchingElem};
      });

      // earlier data, i.e. collectedData, always overwrites new data
      // this is because keys closer to the search source are more likely to belong to it
      collectedData = Object.assign(nodeData, collectedData);
    }
  });

  return collectedData; // e.g. {exampleTitle: {value: "Hello There!", dataSourceElem}}
}

// Used for attributes like: <div data-l-key-widget-code=".widget-code innerHTML"></div>
// helper function, has repeated code from getLocationKeyValue() and setLocationKeyValue()
function getDataFromLocationString (elem, dashCaseKeyName, locationString) {
  locationString = formatSpaces(locationString);
  let [selector, elemAttribute] = locationString.split(" "); // e.g. [".selector", "attr:data-x-text"]
  let targetElem;

  if (!selector || selector === "." || elem.matches(selector)) {
    targetElem = elem;
  } else if (selector === "target") {
    let defaultTargetSelector = `[data-l-target-${dashCaseKeyName}]`;
    if (elem.matches(defaultTargetSelector)) {
      targetElem = elem;
    } else {
      targetElem = elem.querySelector(defaultTargetSelector); // e.g. dashCaseKeyName = "page-title"
    }
  } else {
    targetElem = elem.querySelector(selector);
  }

  return {elemAttribute, targetElem};
}

function getLocationKeyValue (elem, dashCaseKeyName, locationString) {
  let {elemAttribute, targetElem} = getDataFromLocationString(elem, dashCaseKeyName, locationString);
  elemAttribute = elemAttribute || "innerText"; // default to innerText
  let elemValue;
  
  if (elemAttribute.indexOf("attr:") === 0) {
    elemAttribute = elemAttribute.substring(5);
    elemValue = targetElem && targetElem.getAttribute(elemAttribute);
  } else {
    elemValue = targetElem && targetElem[elemAttribute]; // e.g. elem["innerText"]
  }

  return typeof elemValue === "string" ? elemValue.trim() : "";
}

// use like this: setLocationKeyValue(elem, ".selector", "example text")
                                              // ^ this will default to setting innerText if there's no 2nd argument
function setLocationKeyValue (elem, dashCaseKeyName, locationString, value) {
  let {elemAttribute, targetElem} = getDataFromLocationString(elem, dashCaseKeyName, locationString);
  elemAttribute = elemAttribute || "innerText"; // default to innerText

  if (targetElem) {
    let valueTrimmed = value.toString().trim();

    if (elemAttribute.indexOf("attr:") === 0) {
      elemAttribute = elemAttribute.substring(5);
      targetElem.setAttribute(elemAttribute, valueTrimmed);
    } else {
      targetElem[elemAttribute] = valueTrimmed;
    }
  }
}

// utility function for setting a value on a data attribute
// using a key name that could be EITHER a location key or an output key
function setValueForKeyName (elem, keyName, value) {
  // convert the key name to output and location format
  let dashCaseKeyName = camelCaseToDash(keyName)
  let outputAttr = "data-o-key-" + dashCaseKeyName;
  let locationAttr = "data-l-key-" + dashCaseKeyName;
  // if the output format is found, set the value of that attribute
  if (elem.hasAttribute(outputAttr)) {
    elem.setAttribute(outputAttr, value);
  }
  // if the location format is found, set the value using `setLocationKeyValue`
  if (elem.hasAttribute(locationAttr)) {
    let locationString = elem.getAttribute(locationAttr);
    setLocationKeyValue(elem, dashCaseKeyName, locationString, value);
  }
}

function setAllDataToEmptyStringsExceptIds (elem) {
  forEachAttr(elem, function (attrName, attrValue) {
    if (attrName !== "data-o-key-id" && (attrName.startsWith("data-o-key-") || attrName.startsWith("data-l-key-"))) {
      let dashCaseKeyName = attrName.substring("data-?-key-".length);
      let camelCaseKeyName = dashToCamelCase(dashCaseKeyName);

      setValueForKeyName(elem, camelCaseKeyName, "");
    }
  });
}

export {
  parseNode,
  getDataFromNode,
  getDataAndDataSourceElemFromNodeAndAncestors,
  getLocationKeyValue,
  setLocationKeyValue,
  setValueForKeyName,
  setAllDataToEmptyStringsExceptIds
};









