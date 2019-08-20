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
    let [templateName, selector, position] = getAttributeValueAsArray(triggerElem, "data-i-new");

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

      // insert the rendered template into that element
      let whereToInsert = position === "top" ? "afterbegin" : "beforeend";
      listElem.insertAdjacentHTML(whereToInsert, htmlString);

      callSaveFunction({targetElement: listElem});

      if (optionsData.addItemCallback) {
        let itemElem = position === "top" ? listElem.firstElementChild : listElem.lastElementChild;
        optionsData.addItemCallback({listElem, itemElem, templateName, ajaxResponse});
      }
    });

  });
}



