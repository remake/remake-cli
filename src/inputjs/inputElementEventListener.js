import { $ } from '../queryjs';
import { camelCaseToDash } from '../hummingbird/lib/string';
import { callWatchFunctions } from "./syncData";

export default function () {

  $.on("input", "[data-i]", function (event) {
    // 2. get the key name inside the name attribute
    let camelCaseKeyName = event.currentTarget.getAttribute("name");
    // 3. convert camel case to dash case
    let dashCaseKeyName = camelCaseToDash(camelCaseKeyName);
    // 4. form the attribute name from the dash case key name
    let attrName = "data-o-key-" + dashCaseKeyName;
    // 5. get the closest matching [data-o-key-*] element
    let outputElem = event.currentTarget.closest("[" + attrName + "]");
    // 6. get the value of the input
    let newValue = event.currentTarget.value;
    // 7. set the value of its key to the input's value
    outputElem.setAttribute(attrName, newValue);
    // 8. call watch functions
      // we want this so form validation is easier inside inline edit popovers
      // todo: figure out how to NOT call this on every keypress, whether that's debouncing it or simply not calling it
    callWatchFunctions({
      dashCaseKeyName, 
      parentOfTargetElements: outputElem, 
      value: newValue, 
      dataSourceElem: outputElem
    });
  });

}