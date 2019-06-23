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

  // plain toggle, using a <div> or <button> or <a>
    // data-i-toggle data-i-key="done" data-i-value="true"
    // finds matching data-o-key-* and alternates between setting "true" and ""
  $.on("click", "[data-i-toggle]", function (event) {
    let keyName = event.currentTarget.getAttribute("data-i-toggle");

    // set value
    setValue({elem: event.currentTarget, keyName, attributeValue: "true", toggleValue: true});
  })

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


function setValue ({elem, keyName, attributeValue, toggleValue}) {

  // 1. form the output attribute key name
  let dashCaseKeyName = camelCaseToDash(keyName);
  let attributeName = "data-o-key-" + dashCaseKeyName;

  // 2. look for the closest element with that output attribute
  let dataSourceElem = elem.closest("[" + attributeName + "]");

  // 3. set the `data-o-key-*` attribute representing the selected choice on the choice element
  if (!toggleValue) {
    dataSourceElem.setAttribute(attributeName, attributeValue);
  } else {
    if (!dataSourceElem.getAttribute(attributeName)) {
      dataSourceElem.setAttribute(attributeName, attributeValue);
    } else {
      dataSourceElem.setAttribute(attributeName, "");
    }
  }

  // 4. call watch functions since the data is changing
  callWatchFunctions({
    dashCaseKeyName: dashCaseKeyName, 
    parentOfTargetElements: dataSourceElem, 
    value: attributeValue, 
    dataSourceElem: dataSourceElem
  });

}






