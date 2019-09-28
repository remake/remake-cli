import { $ } from '../queryjs';
import { camelCaseToDash } from '../hummingbird/lib/string';
import { forEachAttr } from '../hummingbird/lib/dom';
import { processAttributeString } from '../parse-data-attributes';
import { copyLayout } from '../copy-layout';
import Switches from '../switchjs';
import { getDataFromNode } from '../outputjs';
import autosize from '../vendor/autosize';

// data-i-editable: trigger popover with three buttons (remove, cancel, and save)
// data-i-editable-without-remove: trigger popover with two buttons (cancel and save)
// data-i-editable-with-hide: trigger popover with three buttons (remove, cancel, and save), 
//                            but the remove button is special: it doesn't remove an element, 
//                            it just sets all its data keys to empty strings
export default function () {
  insertRemakeEditPopoverHtml();

  $.on("click", "[data-i-editable], [data-i-editable-without-remove], [data-i-editable-with-hide]", function (event) {
    let editableTriggerElem = event.currentTarget;
    let [ switchName, editableConfigString ] = getEditableInfo(editableTriggerElem);
    let editablePopoverElem = document.querySelector(".remake-edit");
    let editableConfigArr;

    if (editableConfigString) {
      // "profileName(text-single-line: someOption)" => [{name: "profileName", modifier: "text-single-line", args: ["someOption"]}]
      editableConfigArr = processAttributeString(editableConfigString); 
      
      editableConfigArr.forEach(editableConfig => {
        if (!editableConfig.modifier) {
          editableConfig.modifier = "text-single-line"
        }
      });
    } else {
      // auto-generate the editable config if none is present
      //   note: we strip out the id key because it's not editable
      editableConfigArr = generateEditableConfigFromClosestElemWithData(editableTriggerElem);
    }

    // remove old output key attributes
    removeOutputDataAttributes({
      elem: editablePopoverElem,
      keep: []
    });

    // add output key attributes defined in the editable config
    addDataOutputKeys({
      elem: editablePopoverElem, 
      config: editableConfigArr
    });

    // add form field types to single attribute from editable config
    addFormFieldsBeingEdited({
      elem: editablePopoverElem, 
      config: editableConfigArr
    });
    
    // render html inside the edit popover
    let remakeEditAreasElem = editablePopoverElem.querySelector(".remake-edit__edit-areas");
    remakeEditAreasElem.innerHTML = generateRemakeEditAreas({config: editableConfigArr});

    // copy the layout
    copyLayout({
      sourceElem: editableTriggerElem, 
      targetElem: editablePopoverElem, 
      dimensionsName: "width", 
      xOffset: 0, 
      yOffset: 0
    });

    // trigger the switch on
    let switchObj = {name: switchName, elem: editablePopoverElem};
    let actionObj = {name: switchName, elem: editableTriggerElem, type: "on"};
    Switches.turnOn(switchObj, actionObj);

    // autosize textarea
    let textareaElems = Array.from(remakeEditAreasElem.querySelectorAll("textarea"));
    setTimeout(function () {
      textareaElems.forEach(el => autosize(el));
    });

    // focus input
    let firstFormInput = editablePopoverElem.querySelector("textarea, input")
    if (firstFormInput) {
      firstFormInput.focus();
    }
  });

  $.on("click", ".remake-edit__button:not([type='submit'])", function (event) {
    event.preventDefault();
  });

  document.addEventListener("keydown", event => {
    if (event.keyCode === 27) {
      let turnedOnEditablePopovers = Array.from(document.querySelectorAll("[data-switched-on='remakeEdit'], [data-switched-on='remakeEditWithoutRemove'], [data-switched-on='remakeEditWithHide']"));
      
      if (turnedOnEditablePopovers.length > 0) {
        turnedOnEditablePopovers.forEach(el => {
          Switches.turnOff({name: "remakeEdit", elem: el});
          Switches.turnOff({name: "remakeEditWithoutRemove", elem: el});
          Switches.turnOff({name: "remakeEditWithHide", elem: el});
        });
      }
    }
  });
}

function getEditableInfo (elem) {
  if (elem.hasAttribute("data-i-editable")) {
    return [ "remakeEdit", elem.getAttribute("data-i-editable") ];
  } else if (elem.hasAttribute("data-i-editable-without-remove")) {
    return [ "remakeEditWithoutRemove", elem.getAttribute("data-i-editable-without-remove") ];
  } else if (elem.hasAttribute("data-i-editable-with-hide")) {
    return [ "remakeEditWithHide", elem.getAttribute("data-i-editable-with-hide") ];
  }
}

function removeOutputDataAttributes({elem, keep}) {
  let attributesToRemove = [];

  forEachAttr(elem, function (attrName, attrValue) {
    if (attrName.startsWith("data-o-key-")) {
      if (!keep.includes(attrName)) {
        attributesToRemove.push(attrName);
      }
    }
  });

  attributesToRemove.forEach(attrName => elem.removeAttribute(attrName));
}

function addDataOutputKeys ({elem, config}) {
  config.forEach(obj => {
    elem.setAttribute("data-o-key-" + camelCaseToDash(obj.name), "")
  });
}

function addFormFieldsBeingEdited ({elem, config}) {
  let attrValue = config.map(obj => obj.modifier).join(" ");
  elem.setAttribute("data-remake-edit-fields", attrValue)
}

function generateRemakeEditAreas ({config}) { // e.g. {name: "blogTitle", modifier: "text-single-line", args: []}
  let outputHtml = "";

  config.forEach(({modifier, name}) => {
    let formFieldHtml;

    if (modifier === "text-single-line") {
      formFieldHtml = `<input class="remake-edit__input" data-i="" name="${name}" type="text">`;
    }

    if (modifier === "text-multi-line") {
      formFieldHtml = `<textarea class="remake-edit__textarea" data-i="" name="${name}"></textarea>`;
    }

    outputHtml += `<div class="remake-edit__edit-area">${formFieldHtml}</div>`;
  });

  return outputHtml;
}

// example output: [{name: "text", modifier: "text-single-line", args: []}]
function generateEditableConfigFromClosestElemWithData (elem) {
  let elemWithData = elem.closest("[data-o-type]");

  if (!elemWithData) {
    return;
  }

  let dataFromElem = getDataFromNode(elemWithData);
  let objectKeys = Object.keys(dataFromElem);
  // strip out the id key because it's not editable
  let objectKeysWithoutIdKey = objectKeys.filter(keyName => keyName !== "id");

  return objectKeysWithoutIdKey.map(keyName => {
    return {name: keyName, modifier: "text-single-line"}
  });
}

function insertRemakeEditPopoverHtml () {
  let htmlString = `
  <style>
    [data-i-editable-off] #remake__auto-generated, 
    [data-user-not-logged-in] #remake__auto-generated {
      display: none;
    }

    .remake-edit {
      box-sizing: border-box;
      display: none;
      position: absolute;
      font-family: inherit;
    }

    .remake-edit * {
      box-sizing: border-box;
    }

    [data-switched-on~="remakeEdit"], [data-switched-on~="remakeEditWithoutRemove"], [data-switched-on~="remakeEditWithHide"] {
      display: block;
    }

    .remake-edit__backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 9;
    }

    .remake-edit__edit-container {
      position: absolute;
      z-index: 10;
      min-width: 280px;
      width: 100%;
    }

    .remake-edit__edit-area {
      margin-bottom: 8px;
    }

    .remake-edit__textarea, .remake-edit__input {
      display: block;
      width: 100%;
      padding: 7px 14px 9px;
      font-size: 18px;
      border: none;
      outline: none;
      line-height: 1.4em;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
      border-radius: 5px;
    }

    .remake-edit__textarea {
      min-height: 48px;
      resize: none;
    }

    .remake-edit__buttons {
      display: flex;
    }

    .remake-edit__button {
      display: inline-block;
      margin: 0 8px 0 0;
      padding: 7px 14px 9px;
      border: 0;
      outline: none;
      font-size: 18px;
      color: #fff !important;
      background-color: #228be6;
      line-height: 1em;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
      border-radius: 5px;
      cursor: pointer;
      user-select: none;
      text-decoration: none;
    }

    .remake-edit__button:last-child {
      margin: 0;
    }

    .remake-edit__button:hover {
      background-color: #0b6cbf;
      color: #fff;
      text-decoration: none;
    }

    .remake-edit__button--remove, .remake-edit__button--hide {
      background-color: #e03131;
    }

    .remake-edit__button--hide {
      display: none;
    }

    .remake-edit__button--remove:hover, .remake-edit__button--hide:hover {
      background-color: #b42626;
      color: #fff;
    }

    [data-switched-on~="remakeEditWithoutRemove"] .remake-edit__button--remove, [data-switched-on~="remakeEditWithHide"] .remake-edit__button--remove {
      display: none;
    }

    [data-switched-on~="remakeEditWithHide"] .remake-edit__button--hide {
      display: inline-block;
    }

    .remake-edit__button--cancel {
      margin-left: auto;
      background-color: #868E96;
    }

    .remake-edit__button--cancel:hover {
      background-color: #64707d;
      color: #fff;
    }
  </style>
  <div id="remake__auto-generated" data-o-ignore>
    <form 
      class="remake-edit" 

      data-i-sync
      data-switches="remakeEdit(no-auto) remakeEditWithoutRemove(no-auto) remakeEditWithHide(no-auto)"

      data-o-type="object"
    >
      <div 
        class="remake-edit__backdrop"
        data-switch-actions="remakeEdit(off) remakeEditWithoutRemove(off) remakeEditWithHide(off)"
      ></div>
      <div class="remake-edit__edit-container">
        <div class="remake-edit__edit-areas">
        </div>
        <div class="remake-edit__buttons">
          <a 
            class="remake-edit__button remake-edit__button--remove" 
            href="#"
            data-i-remove
            data-switch-actions="remakeEdit(off) remakeEditWithoutRemove(off) remakeEditWithHide(off)"
          >remove</a>
          <a 
            class="remake-edit__button remake-edit__button--hide" 
            href="#"
            data-i-hide
            data-switch-actions="remakeEdit(off) remakeEditWithoutRemove(off) remakeEditWithHide(off)"
          >remove</a>
          <a 
            class="remake-edit__button remake-edit__button--cancel" 
            href="#"
            data-switch-actions="remakeEdit(off) remakeEditWithoutRemove(off) remakeEditWithHide(off)"
          >cancel</a>
          <button 
            class="remake-edit__button remake-edit__button--save" 
            type="submit"
            data-switch-actions="remakeEdit(off) remakeEditWithoutRemove(off) remakeEditWithHide(off)"
          >save</button>
        </div>
      </div>
    </form>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", htmlString);
}






