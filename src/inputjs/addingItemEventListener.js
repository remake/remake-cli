import { $ } from '../queryjs';
import { getAttributeValueAsArray } from '../parse-data-attributes';
import { ajaxPost } from '../hummingbird/lib/ajax';
import { findInParents } from '../hummingbird/lib/dom';
import { callSaveFunction } from './onSave';
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

      callSaveFunction({targetElement: listElem});
    });

  });
}









