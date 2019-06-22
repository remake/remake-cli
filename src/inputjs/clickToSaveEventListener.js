import { $ } from '../queryjs';
import { callSaveFunction } from './onSave';

export default function () {
  $.on("click", "[data-i-click-to-save]", function (event) {

    let clickedElem = event.currentTarget;
    let attributeValue = clickedElem.getAttribute("data-i-click-to-save");

    if (attributeValue === "closest") {
      // setTimeout gives other click events on this element time to fire before the data is saved
      setTimeout(function () {
        callSaveFunction({targetElement: clickedElem});
      });
    }

  });
}