import {
  addDataFromElementToDataObject, 
  createDataObjectFromElement
} from "./dataObjFromElems";
import { 
  setLocationKeyValue, 
  getLocationKeyValue,
  setValueForKeyName,
  getDataFromNode,
  getDataAndDataSourceElemFromNodeAndAncestors,
  setAllDataToEmptyStringsExceptIds
} from "./parseNode";

// special properties:
// * data-o-type (attribute value can be "object" or "list")
// * data-o-key (attribute value can be any string, but ideally camel cased with no spaces)
// * data-o-value (attribute value can be any string)


function getDataFromRootNode (rootNode) {

  let rootData;

  function getDataFromDom (currentElement, parentData) {

    // can this element's data be parsed?
    let canElementDataBeParsed = currentElement.hasAttribute("data-o-type"); 

    // should we skip this element?
    let skipElemAndChildren = currentElement.hasAttribute("data-o-ignore");

    if (skipElemAndChildren) {
      return;
    }

    // if element's data can be parsed, add its data to the current tree of data
    // otherwise, skip it
    if (canElementDataBeParsed) {

      // if there's parent data, add the element's data to it
      // and re-assign parentData to this new iteration's data
      if (parentData) {
        parentData = addDataFromElementToDataObject(currentElement, parentData);
      }

      // if there's no parent data, create new parent data
      if (!parentData && !rootData) {

        // create new parent data
        parentData = createDataObjectFromElement(currentElement);

        // it will also be the original data, since this is the first time through
        rootData = parentData;

      } else if (!parentData && rootData) {

        // special orphaned data case:
        //   instead of letting orphan data (i.e. two or more objects that don't share 
        //   a single parent) overwrite the root data, merge it in with the current root data
        parentData = addDataFromElementToDataObject(currentElement, rootData);

      }

    }

    // pass all the collected data to the next iteration
    let children = currentElement.children;
    for (var i = 0; i < children.length; i++) {
      getDataFromDom(children[i], parentData);
    }

    // after all the iterations, the original data should have all the parsed data from the DOM
    return rootData;

  }

  return getDataFromDom(rootNode);

}

export { 
  getDataFromRootNode,
  setLocationKeyValue,
  getLocationKeyValue,
  setValueForKeyName,
  getDataFromNode,
  getDataAndDataSourceElemFromNodeAndAncestors,
  setAllDataToEmptyStringsExceptIds
}


