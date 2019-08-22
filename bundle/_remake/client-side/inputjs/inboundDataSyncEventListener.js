import { $ } from '../queryjs';
import Switches from '../switchjs';
import { syncDataBetweenElements } from "./syncData";

export default function () {
  // 1. watch for when a switch is switched on
  Switches.when({
    switchAction: "on", 
    callback: function (switchObj, actionObj) {

      // make sure data sync happens after all the data is in place. 
      //   e.g. we might want to have the switch action button also set data
      setTimeout(function () {

        // 2. check its data attributes to see if the switched on element is a data sync elem
        if (switchObj.elem.hasAttribute("data-i-sync")) {

          // 3. copy the data from the action element and its children to this sync elem and its children
          syncDataBetweenElements({
            sourceElement: actionObj.elem, 
            targetElement: switchObj.elem
          });

          // 4. attach the action element to the switched on element as the `sourceElement`
          $.data(switchObj.elem, "source", actionObj.elem);

        }
        
      });
    }
  });
}


