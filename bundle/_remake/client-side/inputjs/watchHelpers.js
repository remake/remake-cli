import { parseStringWithIndefiniteNumberOfParams } from "../parse-data-attributes";
import { dashToCamelCase } from '../hummingbird/lib/string';
import { forEachAttr } from '../hummingbird/lib/dom';
import { getLocationKeyValue, getDataFromNode } from "../outputjs";
import optionsData from './optionsData';

// README
// - watch functions are named inside watch attributes and defined inside app code. they run 
//   usually when the page loads, but not always. they ALWAYS run when data is synced to a data
//   key that matches their own key 
//     (e.g. a sync to `data-o-key-name` will trigger => `data-w-key-name`)

// TIPS
// - if you want a watch function to run every time data in synced, but not on page load, give
//   it a watch attribute, but not a `data-w` attribute.

// WARNING
// - watch attrs must be inside or on their data elements. they can't watch data inside themselves


export function getValueAndDataSourceElemFromKeyName (elem, dashCaseKeyName) {
  // 1. construct the attribute names
  let outputDataAttributeName = "data-o-key-" + dashCaseKeyName; // e.g. "data-o-key-book-title"
  let locationDataAttributeName = "data-l-key-" + dashCaseKeyName; // e.g. "data-l-key-book-title"

  // 2. get the closest element with a matching data attribute (location or output)
  let selector = `[${outputDataAttributeName}], [${locationDataAttributeName}]`;
  let dataSourceElem = elem.closest(selector);

  // 3. get the value from the matching attribute
  let hasOutputDataAttribute = dataSourceElem.hasAttribute(outputDataAttributeName);
  if (hasOutputDataAttribute) {
    return {
      dataSourceElem,
      value: dataSourceElem.getAttribute(outputDataAttributeName)
    };
  } else {
    let locationString = dataSourceElem.getAttribute(locationDataAttributeName);
    return {
      dataSourceElem,
      value: getLocationKeyValue(dataSourceElem, dashCaseKeyName, locationString)
    };
  }
}

// callWatchFunctionsOnElem
// -----------------------
//
// # What does it do?
// It's called from `syncData.js` after data has been synced. Any keys that are synced that match
// a watch attribute cause the functions listed in the watch attribute to be called.
// 
// I.E.
// watchElem: the element with the watch attribute on it
// watchAttrName: the full name of the watch attribute, e.g. data-w-key-title
// value: the new value being set / synced
// dataSourceElem: the element that the value comes from, if there is one
// dataTargetElem: the element that the value is synced into -- not necessarily the watchElem
export function callWatchFunctionsOnElem ({watchElem, watchAttrName, value, dataSourceElem, dataTargetElem}) {

  // get camel case key name
  let camelCaseKeyName = dashToCamelCase(watchAttrName.substring("data-w-key-".length));

  // get the string to be parsed
  let watchAttributeString = watchElem.getAttribute(watchAttrName);

  // parses the watch attribute into a series of function/argument pairs
  //   e.g. [{funcName: "func1", args: ["1", "2"]}, {funcName: "func2", args: []}]
  let listOfFunctionsWithTheirArguments = parseStringWithIndefiniteNumberOfParams(watchAttributeString);

  // call each watch function
  listOfFunctionsWithTheirArguments.forEach(function ({funcName, args}) {
    let watchFunc = optionsData.watchFunctions && (optionsData.watchFunctions[funcName] || optionsData.watchFunctions["*"]);
    
    watchFunc({
      watchElem, 
      watchAttrName, 
      camelCaseKeyName,
      value, 
      dataSourceElem,
      watchFuncName: funcName,
      watchFuncArgs: args,
      dataTargetElem
    });
  });
}


// # What does it do?
// Takes an array of watch elements, loops through them, then loops through all their attributes,
// gets all the watch attributes and calls them, using the closest output attribute as a data
// source.
//
// # Note: it doesn't loop through child elements.
//
// # When is it called?
// Called, for example, on page load. Or when a new element is added to the page that has watch
// data attributes on it.
//
// e.g.
// callMultipleWatchFunctions($("[data-w]").arr)
//
//     watchElems: <div data-w data-w-key-x="func1 a" data-w-key-y="func2 b"></div>
//
export function callMultipleWatchFunctions (watchElems) { 

  // get the watch key prefix
  let keyPrefix = "data-w-key-";
  let keyPrefixLength = keyPrefix.length;

  // loop through each watch elem
  watchElems.forEach((watchElem) => {

    // loop through each attribute of the watch elem
    forEachAttr(watchElem, (attrName, attrValue) => {

      // test to see if the attribute is a watch attribute
      if (attrName.indexOf(keyPrefix) === 0) {

        // get dash case key name from watch attribute
        let dashCaseKeyName = attrName.substring(keyPrefixLength); // e.g. book-title

        // get the value to set from closest data source
        let {value, dataSourceElem} = getValueAndDataSourceElemFromKeyName(watchElem, dashCaseKeyName);

        // call the watch function for this attribute, using the value from the closest data source
        callWatchFunctionsOnElem({
          watchElem, 
          watchAttrName: attrName, 
          value, 
          dataSourceElem,
          dataTargetElem: dataSourceElem
        });
      }
    });

  });
}

// Find all elements with watch functions attached to them on an element or on any of
// its child elements.
//
// IMPORTANT: this filters out any elements that are nested inside of a matching
//            data-o-key- attribute. we do this to allow multiple matching data-o-key- 
//            attributes to be on the same page without interfering with each other.
// TODO: this should also work with data-l-key- attributes, not just data-o-key- attributes
export function getWatchElements ({elementWithData, dashCaseKeyName}) {
  let watchSelector = `[data-w-key-${dashCaseKeyName}]`;
  let nestedWatchSelector = `:scope [data-o-key-${dashCaseKeyName}] [data-w-key-${dashCaseKeyName}]`;
  let watchElements = [];

  if (elementWithData.matches(watchSelector)) {
    watchElements.push(elementWithData);
  }

  let allWatchElements = Array.from(elementWithData.querySelectorAll(watchSelector));
  let nestedWatchElements = Array.from(elementWithData.querySelectorAll(nestedWatchSelector));

  return watchElements.concat(allWatchElements.filter(el => !nestedWatchElements.includes(el)));
}



