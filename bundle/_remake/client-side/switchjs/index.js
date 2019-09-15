// Turn on, off, or toggle multiple switches by clicking an action trigger element

// 1. find all the action triggers that are ancestors of the clicked element
// 2. parse each action trigger (get the name of the switch, the action, and the context)
// 3. remove all actions that have been stopped (or triggered by closer ancestors)
// 4. for each triggered switch
//    a. find the switch, using the context parameter if present
//    b. check if switch is on
//    c. turn switch on or off, applying custom switch name if present
// 5. auto deactivate activated switches (if they should be)

// SYNTAX
// data-switches="switchName(auto, customActiveSwitchName) switchName2(no-auto)"
// data-switch-actions="switchName(toggle, ancestors)"
// data-switch-stop="switchName"
// data-switched-on="switchName"

// Simple example:
// ---------------
// <a data-switch-actions="sidebar(toggle)">Toggle Sidebar</a>
// <div data-switches="sidebar" data-switch-stop="sidebar">
//   <button data-switch-actions="sidebar(off)">Close Sidebar</button>
//   <div>Sidebar Content</div>
// </div>

import { $ } from "../queryjs";
import { getParents } from "../hummingbird/lib/dom";
import { 
  parseSwitchActionAttributes, 
  parseSwitchAttributes,
  parseSwitchStopAttributes,
  parseSwitchedOnAttributes
} from "../parse-data-attributes"; 
import { isStringANumber } from "../hummingbird/lib/string";

document.addEventListener("click", function (event) {
  let triggeredSwitches = [];

  // 1. find all the action triggers that are ancestors of the clicked element (includes `stop` elements)
  let actionElements = getActionElemsFromTargetAndParents(event.target);

  // 2. parse each action trigger (get the name of the switch, the action, and the context)
  let unfilteredActions = getActionsData(actionElements);

  // 3. remove all actions that have been stopped
  let {actionsToTrigger, stopActions} = processActions(unfilteredActions);

  // 4. for each triggered switch
  actionsToTrigger.forEach((actionToTrigger) => { // e.g. {name, type, context, elem}
    // a. find the switch, using context if present
    let targetSwitchElements = getTargetSwitchElements(actionToTrigger); 
    
    // b. get the switch data from the target elements using the switch name
    let targetSwitches = getSwitchesByNameFromElements(actionToTrigger.name, targetSwitchElements);

    // c. turn switch on or off, applying custom switch name if present
    targetSwitches.forEach((targetSwitch) => { // e.g. {name, elem, customName, auto}
      if (actionToTrigger.type === "toggle") {
        toggle(targetSwitch, actionToTrigger);
      } else if (actionToTrigger.type === "on") {
        turnOn(targetSwitch, actionToTrigger);
      } else if (actionToTrigger.type === "off") {
        turnOff(targetSwitch, actionToTrigger);
      }
    });

    // c. keep track of all switches and their elements that were affected by this click
    triggeredSwitches = triggeredSwitches.concat(targetSwitches);
  });

  // 5. auto deactivate activated switches (if they should be)
  automaticallyTurnOffOtherSwitches(triggeredSwitches, stopActions);
  
});

function getActionElemsFromTargetAndParents (elem) {
  let selector = "[data-switch-actions], [data-switch-stop]";
  let actionElements = getParents({elem, selector, includeCurrentElement: true});
  return actionElements;
}

function getActionsData (actionElements) {
  return actionElements.reduce((accumulator, actionElement) => {
    let actionsList = [];

    if (actionElement.matches("[data-switch-actions]")) {
      actionsList = actionsList.concat(parseSwitchActionAttributes(actionElement)); // e.g. [{name: "switchName", type: "toggle", context: "ancestors"}]
    }

    if (actionElement.matches("[data-switch-stop]")) {
      actionsList = actionsList.concat(parseSwitchStopAttributes(actionElement)); // e.g. [{name: "switchName"}]
    }

    actionsList.forEach((action) => action.elem = actionElement);
    return accumulator.concat(actionsList); 
  }, []);
}

// remove all actions targeting the same switch name as another action before them

// Example:
// [1(toggle), 2(stop), 2(on), 5(on), 6(on), 6(stop), 8(off), 1(on)]
// 1 toggles, 2 does nothing, 5 turns on, 6 turns on, 8 turns off, and the last 1 doesn't fire
function processActions (unfilteredActions) { // e.g. [{name: "switchName", type: "toggle", context: "ancestors", elem: elem}]
  let processedActions = [];
  let actionsToTrigger = [];
  let stopActions = [];

  // 1. loop through all unfiltered actions
  unfilteredActions.forEach((unfilteredAction) => {
    let isAlreadyProcessed = processedActions.some((processedAction) => processedAction.name === unfilteredAction.name);

    // 2. check if action has already occurred earlier
    if (!isAlreadyProcessed) {

      // 3. if action is not a stop action, add action to actions that should be triggered
      if (unfilteredAction.type) {
        actionsToTrigger.push(unfilteredAction);
      } else {
        stopActions.push(unfilteredAction);
      }

      processedActions.push(unfilteredAction);
    }
  });

  return {actionsToTrigger, stopActions};
}

function getTargetSwitchElements (action) { 
  // action: e.g. {name, type, context}
  // type is either "toggle" or "on" or "off"
  // context can either be "ancestors" or a number starting at 0
  let {name, context, elem} = action;
  let selector = `[data-switches~='${name}'], [data-switches*='${name}(']`; // matches a space separated name, as well as a name followed by an open parentheses anywhere in the attribute
  let switchElements;

  if (context) {
    if (context === "ancestors") {
      switchElements = getParents({elem, selector, includeCurrentElement: true});
    } else if (isStringANumber(context)) {
      let positionNumber = parseInt(context, 10);
      let allSwitchElements = $(selector).arr;
      switchElements = allSwitchElements.splice(positionNumber, 1); // splice will return elem at `positionNumber` index and wrap it an array
    }
  } else {
    switchElements = $(selector).arr;
  }

  return switchElements;
}

function getSwitchesByNameFromElements (switchName, switchElements) { // switchElements is elems with attr: e.g. data-switches="switchName(auto, customName)"
  // 1. loop through the switch elements
  let switches = switchElements.map((switchElement) => {

    // 2. get all the switch data
    let switchesList = parseSwitchAttributes(switchElement); // [{"name", "auto", "customName"}]

    // 3. filter through the switch data until you find the current switch name
    let switchData = switchesList.find((switchObj) => switchObj.name === switchName);

    // 4. add the element to the switch data
    switchData.elem = switchElement;

    return switchData;
  });

  return switches; // e.g. [{name, auto, customName, elem}]
}

function isOn (switchName, elem) {
  return elem.matches(`[data-switched-on~=${switchName}]`);
}

function getTurnedOnSwitchNamesFromElem (elem) {
  let switches = parseSwitchedOnAttributes(elem); // [{name}]
  let switchNames = switches.map((switchObj) => switchObj.name); // ["switchName"]
  return switchNames;
}

function turnOn (switchObj, actionObj) { // e.g. {name, elem, customName, auto}
  let isSwitchOn = isOn(switchObj.name, switchObj.elem);

  if (!isSwitchOn) {

    // 1. get turned on switch names
    let switchNames = getTurnedOnSwitchNamesFromElem(switchObj.elem); // ["switchName"]

    // 2. add the new switch name and the (optional) custom name 
    switchNames.push(switchObj.name);
    if (switchObj.customName) {
      switchNames.push(switchObj.customName);
    } 

    // 3. replace old attribute values with new ones (including the old ones too)
    switchObj.elem.setAttribute("data-switched-on", switchNames.join(" "));
  }

  actionObj = Object.assign({}, actionObj, {type: "on"});
  switchObj.on = isSwitchOn; 
  triggerCallbacks(switchObj, actionObj)
} 

// This function really just needs a switch name and a switch elem, which can be 
//   passed in on the switchObj: {name, elem}
function turnOff (switchObj, actionObj) { // e.g. {name, elem, customName, auto}
  let isSwitchOn = isOn(switchObj.name, switchObj.elem);

  if (isSwitchOn) {

    // 1. get turned on switch names
    let switchNames = getTurnedOnSwitchNamesFromElem(switchObj.elem); // ["switchName"]

    // 2. remove the passed in switch name and the (optional) custom name 
    let filteredSwitchNames = switchNames.filter((name) => {
      let nameMatches = name === switchObj.name;
      let customNameMatches = name === switchObj.customName;
      
      if (nameMatches || customNameMatches) {
        return false;
      } else {
        return true;
      }
    });

    if (filteredSwitchNames.length > 0) {
      // 3. replace old attribute values with new ones
      switchObj.elem.setAttribute("data-switched-on", filteredSwitchNames.join(" "));
    } else {
      // 4. remove the attribute entirely if there are no active switches
      switchObj.elem.removeAttribute("data-switched-on");
    }
  }

  actionObj = Object.assign({}, actionObj, {type: "off"});
  switchObj.on = isSwitchOn; 
  triggerCallbacks(switchObj, actionObj)
}

function toggle (switchObj, actionObj) {
  let isSwitchOn = isOn(switchObj.name, switchObj.elem);

  if (isSwitchOn) {
    turnOff(switchObj, actionObj);
  } else {
    turnOn(switchObj, actionObj);
  }

  switchObj.on = isSwitchOn; 
  triggerCallbacks(switchObj, actionObj);
}


function automaticallyTurnOffOtherSwitches (triggeredSwitches, stopActions) { // [{name, elem, customName, auto}]

  // 1. get all the turned on switch elements
  let turnedOnSwitchElements = $("[data-switched-on]").arr;

  // 2. for each switch element:
  turnedOnSwitchElements.forEach((switchElem) => {

    // a. get the turned on switch names, e.g. ["switchName", "switchName2"]
    let turnedOnSwitchNames = getTurnedOnSwitchNamesFromElem(switchElem); 

    // b. get all the switch data from the element, e.g. [{name, customName, auto}]
    let allSwitchesFromTurnedOnElement = parseSwitchAttributes(switchElem);

    let switchesToTurnOff = allSwitchesFromTurnedOnElement.filter((switchObj) => { // {name, customName, auto}

      // c. filter this array so it only includes the turned on switches
      if (!turnedOnSwitchNames.includes(switchObj.name)) {
        return false;
      }

      // d. filter out switches that have the "auto" property set to "no-auto"
      if (switchObj.auto === "no-auto") {
        return false;
      }

      // e. filter out switches whose actions were stopped
      let switchHasBeenStopped = stopActions.find((stopAction) => stopAction.name === switchObj.name);
      if (switchHasBeenStopped) {
        return false;
      }

      // f. filter out switches that were already activated (by matching their name AND element)
      let switchHasBeenProcessed = triggeredSwitches.find((processedSwitch) => processedSwitch.name === switchObj.name && processedSwitch.elem === switchElem);
      if (switchHasBeenProcessed) {
        return false;
      }

      return true;

    });

    // f. turn off every switch in this final list
    switchesToTurnOff.forEach((switchObj) => {
      switchObj.elem = switchElem;
      turnOff(switchObj);
    });
    
  });
}



let callbackList = []; // e.g. [{switchName, switchAction, switchElem, callback}]

// parameters to pass in:
// {switchName, switchAction, switchElem, callback}
// -------
// switchName     (optional)
// switchAction   (optional)
// switchElem     (optional)
// callback       (required)
// -------
// E.g.
// Switches.when({switchAction: "toggle", switchName, switchElem, callback});
// -------
// return values:
// 1. switchObj: {name, auto, customName, elem, on}
// 2. actionObj: {name, type, context, elem}
// -------
// Warning: the toggle action triggers two callbacks at the same time: toggle, as well as on/off.
//          so, if you don't pass in an actionType parameter, your callback might be called twice
function when (switchObj) { 
  callbackList.push(switchObj);
}

function triggerCallbacks (switchObj, actionObj) { // matching on: switchObj.name, actionObj.type, switchObj.elem
  // switchObj: {name, auto, customName, elem}
  // actionObj: {name, type, context, elem}
  let objToMatchAgainst = {
    switchName: switchObj.name,
    switchAction: actionObj.type,
    switchElem: switchObj.elem
  };

  callbackList.forEach((callbackData) => {
    let isMatching = Object.keys(callbackData).every((keyName) => {
      if (keyName === "callback") {
        return true;
      }

      return callbackData[keyName] === objToMatchAgainst[keyName];
    });

    if (isMatching) {
      callbackData.callback(switchObj, actionObj);
    }
  });
}


export default {
  isOn,
  turnOn, 
  turnOff,
  toggle,
  when
}






