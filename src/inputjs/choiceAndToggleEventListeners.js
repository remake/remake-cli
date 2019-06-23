import { $ } from '../queryjs';
import { camelCaseToDash } from '../hummingbird/lib/string';
import { callWatchFunctions } from './syncData';

export default function () {

  // plain choice, using a <div> or <button> or <a>
  $.on("click", "[data-i][data-i-key][data-i-value]", function (event) {
    // get key name and value we want to change
    let keyName = event.currentTarget.getAttribute("data-i-key");
    let attributeValue = event.currentTarget.getAttribute("data-i-value");

    // set value
    setValue({elem: event.currentTarget, keyName, attributeValue});
  });


  // <radio> AND <select>
  $.on("change", "[data-i][type='radio'], select[data-i]", function (event) {
    // get key name and value we want to change
    let keyName = event.currentTarget.getAttribute("name");
    let attributeValue = event.currentTarget.value;

    // set value
    setValue({elem: event.currentTarget, keyName, attributeValue});
  });


  // <checkbox>
  $.on("change", "[data-i][type='checkbox']", function (event) {
    // get key name and value we want to change
    let keyName = event.currentTarget.getAttribute("name");
    let attributeValue = event.currentTarget.checked ? event.currentTarget.value : "";

    // set value
    setValue({elem: event.currentTarget, keyName, attributeValue});
  });

}


function setValue ({elem, keyName, attributeValue}) {

  // 1. form the output attribute key name
  let dashCaseKeyName = camelCaseToDash(keyName);
  let attributeName = "data-o-key-" + dashCaseKeyName;

  // 2. look for the closest element with that output attribute
  let choiceElement = elem.closest("[" + attributeName + "]");

  // 3. set the `data-o-key-*` attribute representing the selected choice on the choice element
  choiceElement.setAttribute(attributeName, attributeValue);

  // 4. call watch functions since the data is changing
  let dataSourceElem = choiceElement;
  callWatchFunctions({
    dashCaseKeyName: dashCaseKeyName, 
    parentOfTargetElements: dataSourceElem, 
    value: attributeValue, 
    dataSourceElem: dataSourceElem
  });

}








