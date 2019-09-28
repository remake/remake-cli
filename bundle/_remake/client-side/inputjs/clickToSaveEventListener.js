import { $ } from '../queryjs';
import { callSaveFunction } from './onSave';

export default function () {
  $.on("click", "[data-i-click-to-save]", function (event) {
    let clickedElem = event.currentTarget;

    // setTimeout gives other click events on this element that
    // might set data time to fire before the data is saved
    setTimeout(function () {
      callSaveFunction({targetElement: clickedElem});
    });
  });
}