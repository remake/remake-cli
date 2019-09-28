import { $ } from '../queryjs';
import { getAttributeValueAsArray } from '../parse-data-attributes';
import { ajaxPost } from '../hummingbird/lib/ajax';
import { findInParents } from '../hummingbird/lib/dom';
import { isStringANumber } from '../hummingbird/lib/string';
import { callSaveFunction } from './onSave';
import optionsData from './optionsData';

export default function () {
  $.on("click", "[data-i-new]", function (event) {
    let triggerElem = event.currentTarget;
    
    // parse the data attribute to get the selector and the template name
    let [templateName, ...otherArgs] = getAttributeValueAsArray(triggerElem, "data-i-new");

    // allow data-i-new attribute value to have its arguments in any order
    let selector, position;
    if (otherArgs.length === 0) {
      selector = "[data-o-type='list']";
    } else {
      let indexOfPosition = otherArgs.indexOf("top") === -1 ? otherArgs.indexOf("bottom") : otherArgs.indexOf("top");

      if (indexOfPosition !== -1) {
        position = otherArgs.splice(indexOfPosition, 1)[0];
      }

      if (otherArgs.length > 0) {
        selector = otherArgs[0];
      } else {
        selector = "[data-o-type='list']";
      }
    }

    // pass the template name into an endpoint and get the resulting html back
    ajaxPost("/new", {templateName}, function (ajaxResponse) {
      let {htmlString, success} = ajaxResponse;

      if (!success) {
        if (optionsData.addItemCallback) {
          optionsData.addItemCallback({templateName, ajaxResponse});
        }
        return;
      }

      // find the closest element matching the selector
      let listElem = findInParents(triggerElem, selector);

      if (!listElem) {
        console.log("%cError: Couldn't find list element to insert new item into", "color: #e03131;");
        return;
      }

      // insert the rendered template into that element
      let whereToInsert = position === "top" ? "afterbegin" : "beforeend";
      listElem.insertAdjacentHTML(whereToInsert, htmlString);

      // save needs to be called on the list element, not the item, so it doesn't try to save to a non-existent id
      callSaveFunction({targetElement: listElem});

      if (optionsData.addItemCallback) {
        let itemElem = position === "top" ? listElem.firstElementChild : listElem.lastElementChild;
        optionsData.addItemCallback({listElem, itemElem, templateName, ajaxResponse});
      }
    });

  });
}



