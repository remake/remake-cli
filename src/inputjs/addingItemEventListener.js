import { $ } from '../queryjs';
import { getAttributeValueAsArray } from '../parse-data-attributes';
import { ajaxPost } from '../hummingbird/lib/ajax';
import { findInParents } from '../hummingbird/lib/dom';
import { isStringANumber } from '../hummingbird/lib/string';
import { callSaveFunction, getSaveFuncNameAndPath } from './onSave';
import optionsData from './optionsData';

export default function () {
  $.on("click", "[data-i-new]", function (event) {
    let triggerElem = event.currentTarget;
    
    // parse the data attribute to get the selector and the template name
    let [templateName, selector, position] = getAttributeValueAsArray(triggerElem, "data-i-new");

    // pass the template name into an endpoint and get the resulting html back
    ajaxPost("/new", {templateName}, function (res) {
      let {htmlString} = res;

      // find the closest element matching the selector
      let listElem = findInParents(triggerElem, selector);

      // insert the rendered template into that element
      let whereToInsert = position === "top" ? "afterbegin" : "beforeend";
      listElem.insertAdjacentHTML(whereToInsert, htmlString);

      recomputeSavePathOnListElems(listElem, whereToInsert);

      callSaveFunction({targetElement: listElem});
    });

  });
}

// This feels a little dangerous, like it might make too many small assumptions (assumption 1: listElem contains list items and no other types of elements, assumption 2: the elems in listElem start with the index 0 item)
// -> This function recomputes any `path:` string arguments inside `data-o-save` or `data-o-save-deep` attributes
//    these need to be recomputed because a new elem was just added to the beginning or the end of the list so the list items may have shifted (and the new item might not know its own index)
function recomputeSavePathOnListElems(listElem, whereToInsert) {
  let newElem = whereToInsert === "afterbegin" ? listElem.firstElementChild : listElem.lastElementChild;
  let isNormalSave = newElem.matches("[data-o-save]");
  let isDeepSave = newElem.matches("[data-o-save-deep]");

  // check to see if there's any kind of save attribute on this element and skip it if not
  if (!isNormalSave && !isDeepSave) {
    return;
  }

  // get the save attribute value
  let [ saveFuncName, savePath ] = getSaveFuncNameAndPath(newElem, isDeepSave);

  // if there's no `savePath`, skip processing this list
  if (!savePath) {
    return;
  }

  // if the path string doesn't end with a period or a number, skip processing this list (because it means the current element isn't an item in an array)
  // we're checking for a period because the elem's index might be missing at the end of the string and not be rendered -- and we're okay with that
  let endsWithPeriodOrNumberRegex = /\.\d*$/;
  if (!endsWithPeriodOrNumberRegex.test(savePath)) {
    return;
  }

  // for all the elements inside the listElem, replace the number at the end of the path string with incrementing numbers starting with 0
  let childElems = listElem.children;
  let saveAttributeToSet = isNormalSave ? "data-o-save" : "data-o-save-deep";
  let saveAttributeValueTemplate = saveFuncName + " " + savePath;
  for (var i = 0; i < childElems.length; i++) {
    let listItemElem = childElems[i];
    let saveAttributeValue = saveAttributeValueTemplate.replace(endsWithPeriodOrNumberRegex, "." + i);
    listItemElem.setAttribute(saveAttributeToSet, saveAttributeValue);
  }
}








