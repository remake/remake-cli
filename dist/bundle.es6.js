import { merge } from 'lodash-es';

// Public: Create a new SelectorSet.
function SelectorSet() {
  // Construct new SelectorSet if called as a function.
  if (!(this instanceof SelectorSet)) {
    return new SelectorSet();
  }

  // Public: Number of selectors added to the set
  this.size = 0;

  // Internal: Incrementing ID counter
  this.uid = 0;

  // Internal: Array of String selectors in the set
  this.selectors = [];

  // Internal: All Object index String names mapping to Index objects.
  this.indexes = Object.create(this.indexes);

  // Internal: Used Object index String names mapping to Index objects.
  this.activeIndexes = [];
}

// Detect prefixed Element#matches function.
var docElem = window.document.documentElement;
var matches = (docElem.matches ||
                docElem.webkitMatchesSelector ||
                docElem.mozMatchesSelector ||
                docElem.oMatchesSelector ||
                docElem.msMatchesSelector);

// Public: Check if element matches selector.
//
// Maybe overridden with custom Element.matches function.
//
// el       - An Element
// selector - String CSS selector
//
// Returns true or false.
SelectorSet.prototype.matchesSelector = function(el, selector) {
  return matches.call(el, selector);
};

// Public: Find all elements in the context that match the selector.
//
// Maybe overridden with custom querySelectorAll function.
//
// selectors - String CSS selectors.
// context   - Element context
//
// Returns non-live list of Elements.
SelectorSet.prototype.querySelectorAll = function(selectors, context) {
  return context.querySelectorAll(selectors);
};


// Public: Array of indexes.
//
// name     - Unique String name
// selector - Function that takes a String selector and returns a String key
//            or undefined if it can't be used by the index.
// element  - Function that takes an Element and returns an Array of String
//            keys that point to indexed values.
//
SelectorSet.prototype.indexes = [];

// Index by element id
var idRe = /^#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
SelectorSet.prototype.indexes.push({
  name: 'ID',
  selector: function matchIdSelector(sel) {
    var m;
    if (m = sel.match(idRe)) {
      return m[0].slice(1);
    }
  },
  element: function getElementId(el) {
    if (el.id) {
      return [el.id];
    }
  }
});

// Index by all of its class names
var classRe = /^\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
SelectorSet.prototype.indexes.push({
  name: 'CLASS',
  selector: function matchClassSelector(sel) {
    var m;
    if (m = sel.match(classRe)) {
      return m[0].slice(1);
    }
  },
  element: function getElementClassNames(el) {
    var className = el.className;
    if (className) {
      if (typeof className === 'string') {
        return className.split(/\s/);
      } else if (typeof className === 'object' && 'baseVal' in className) {
        // className is a SVGAnimatedString
        // global SVGAnimatedString is not an exposed global in Opera 12
        return className.baseVal.split(/\s/);
      }
    }
  }
});

// Index by tag/node name: `DIV`, `FORM`, `A`
var tagRe = /^((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
SelectorSet.prototype.indexes.push({
  name: 'TAG',
  selector: function matchTagSelector(sel) {
    var m;
    if (m = sel.match(tagRe)) {
      return m[0].toUpperCase();
    }
  },
  element: function getElementTagName(el) {
    return [el.nodeName.toUpperCase()];
  }
});

// Default index just contains a single array of elements.
SelectorSet.prototype.indexes['default'] = {
  name: 'UNIVERSAL',
  selector: function() {
    return true;
  },
  element: function() {
    return [true];
  }
};


// Use ES Maps when supported
var Map$1;
if (typeof window.Map === 'function') {
  Map$1 = window.Map;
} else {
  Map$1 = (function() {
    function Map() {
      this.map = {};
    }
    Map.prototype.get = function(key) {
      return this.map[key + ' '];
    };
    Map.prototype.set = function(key, value) {
      this.map[key + ' '] = value;
    };
    return Map;
  })();
}


// Regexps adopted from Sizzle
//   https://github.com/jquery/sizzle/blob/1.7/sizzle.js
//
var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g;

// Internal: Get indexes for selector.
//
// selector - String CSS selector
//
// Returns Array of {index, key}.
function parseSelectorIndexes(allIndexes, selector) {
  allIndexes = allIndexes.slice(0).concat(allIndexes['default']);

  var allIndexesLen = allIndexes.length,
      i, j, m, dup, rest = selector,
      key, index, indexes = [];

  do {
    chunker.exec('');
    if (m = chunker.exec(rest)) {
      rest = m[3];
      if (m[2] || !rest) {
        for (i = 0; i < allIndexesLen; i++) {
          index = allIndexes[i];
          if (key = index.selector(m[1])) {
            j = indexes.length;
            dup = false;
            while (j--) {
              if (indexes[j].index === index && indexes[j].key === key) {
                dup = true;
                break;
              }
            }
            if (!dup) {
              indexes.push({index: index, key: key});
            }
            break;
          }
        }
      }
    }
  } while (m);

  return indexes;
}

// Internal: Find first item in Array that is a prototype of `proto`.
//
// ary   - Array of objects
// proto - Prototype of expected item in `ary`
//
// Returns object from `ary` if found. Otherwise returns undefined.
function findByPrototype(ary, proto) {
  var i, len, item;
  for (i = 0, len = ary.length; i < len; i++) {
    item = ary[i];
    if (proto.isPrototypeOf(item)) {
      return item;
    }
  }
}

// Public: Log when added selector falls under the default index.
//
// This API should not be considered stable. May change between
// minor versions.
//
// obj - {selector, data} Object
//
//   SelectorSet.prototype.logDefaultIndexUsed = function(obj) {
//     console.warn(obj.selector, "could not be indexed");
//   };
//
// Returns nothing.
SelectorSet.prototype.logDefaultIndexUsed = function() {};

// Public: Add selector to set.
//
// selector - String CSS selector
// data     - Optional data Object (default: undefined)
//
// Returns nothing.
SelectorSet.prototype.add = function(selector, data) {
  var obj, i, indexProto, key, index, objs,
      selectorIndexes, selectorIndex,
      indexes = this.activeIndexes,
      selectors = this.selectors;

  if (typeof selector !== 'string') {
    return;
  }

  obj = {
    id: this.uid++,
    selector: selector,
    data: data
  };

  selectorIndexes = parseSelectorIndexes(this.indexes, selector);
  for (i = 0; i < selectorIndexes.length; i++) {
    selectorIndex = selectorIndexes[i];
    key = selectorIndex.key;
    indexProto = selectorIndex.index;

    index = findByPrototype(indexes, indexProto);
    if (!index) {
      index = Object.create(indexProto);
      index.map = new Map$1();
      indexes.push(index);
    }

    if (indexProto === this.indexes['default']) {
      this.logDefaultIndexUsed(obj);
    }
    objs = index.map.get(key);
    if (!objs) {
      objs = [];
      index.map.set(key, objs);
    }
    objs.push(obj);
  }

  this.size++;
  selectors.push(selector);
};

// Public: Remove selector from set.
//
// selector - String CSS selector
// data     - Optional data Object (default: undefined)
//
// Returns nothing.
SelectorSet.prototype.remove = function(selector, data) {
  if (typeof selector !== 'string') {
    return;
  }

  var selectorIndexes, selectorIndex, i, j, k, selIndex, objs, obj;
  var indexes = this.activeIndexes;
  var removedIds = {};
  var removeAll = arguments.length === 1;

  selectorIndexes = parseSelectorIndexes(this.indexes, selector);
  for (i = 0; i < selectorIndexes.length; i++) {
    selectorIndex = selectorIndexes[i];

    j = indexes.length;
    while (j--) {
      selIndex = indexes[j];
      if (selectorIndex.index.isPrototypeOf(selIndex)) {
        objs = selIndex.map.get(selectorIndex.key);
        if (objs) {
          k = objs.length;
          while (k--) {
            obj = objs[k];
            if (obj.selector === selector && (removeAll || obj.data === data)) {
              objs.splice(k, 1);
              removedIds[obj.id] = true;
            }
          }
        }
        break;
      }
    }
  }

  this.size -= Object.keys(removedIds).length;
};

// Sort by id property handler.
//
// a - Selector obj.
// b - Selector obj.
//
// Returns Number.
function sortById(a, b) {
  return a.id - b.id;
}

// Public: Find all matching decendants of the context element.
//
// context - An Element
//
// Returns Array of {selector, data, elements} matches.
SelectorSet.prototype.queryAll = function(context) {
  if (!this.selectors.length) {
    return [];
  }

  var matches = {}, results = [];
  var els = this.querySelectorAll(this.selectors.join(', '), context);

  var i, j, len, len2, el, m, match, obj;
  for (i = 0, len = els.length; i < len; i++) {
    el = els[i];
    m = this.matches(el);
    for (j = 0, len2 = m.length; j < len2; j++) {
      obj = m[j];
      if (!matches[obj.id]) {
        match = {
          id: obj.id,
          selector: obj.selector,
          data: obj.data,
          elements: []
        };
        matches[obj.id] = match;
        results.push(match);
      } else {
        match = matches[obj.id];
      }
      match.elements.push(el);
    }
  }

  return results.sort(sortById);
};

// Public: Match element against all selectors in set.
//
// el - An Element
//
// Returns Array of {selector, data} matches.
SelectorSet.prototype.matches = function(el) {
  if (!el) {
    return [];
  }

  var i, j, k, len, len2, len3, index, keys, objs, obj, id;
  var indexes = this.activeIndexes, matchedIds = {}, matches = [];

  for (i = 0, len = indexes.length; i < len; i++) {
    index = indexes[i];
    keys = index.element(el);
    if (keys) {
      for (j = 0, len2 = keys.length; j < len2; j++) {
        if (objs = index.map.get(keys[j])) {
          for (k = 0, len3 = objs.length; k < len3; k++) {
            obj = objs[k];
            id = obj.id;
            if (!matchedIds[id] && this.matchesSelector(el, obj.selector)) {
              matchedIds[id] = true;
              matches.push(obj);
            }
          }
        }
      }
    }
  }

  return matches.sort(sortById);
};

var bubbleEvents = {};
var captureEvents = {};
var propagationStopped = new WeakMap();
var immediatePropagationStopped = new WeakMap();
var currentTargets = new WeakMap();
var currentTargetDesc = Object.getOwnPropertyDescriptor(Event.prototype, 'currentTarget');

function before(subject, verb, fn) {
  var source = subject[verb];
  subject[verb] = function () {
    fn.apply(subject, arguments);
    return source.apply(subject, arguments);
  };
  return subject;
}

function matches$1(selectors, target, reverse) {
  var queue = [];
  var node = target;

  do {
    if (node.nodeType !== 1) break;
    var _matches = selectors.matches(node);
    if (_matches.length) {
      var matched = { node: node, observers: _matches };
      if (reverse) {
        queue.unshift(matched);
      } else {
        queue.push(matched);
      }
    }
  } while (node = node.parentElement);

  return queue;
}

function trackPropagation() {
  propagationStopped.set(this, true);
}

function trackImmediate() {
  propagationStopped.set(this, true);
  immediatePropagationStopped.set(this, true);
}

function getCurrentTarget() {
  return currentTargets.get(this) || null;
}

function defineCurrentTarget(event, getter) {
  if (!currentTargetDesc) return;

  Object.defineProperty(event, 'currentTarget', {
    configurable: true,
    enumerable: true,
    get: getter || currentTargetDesc.get
  });
}

function dispatch(event) {
  var events = event.eventPhase === 1 ? captureEvents : bubbleEvents;

  var selectors = events[event.type];
  if (!selectors) return;

  var queue = matches$1(selectors, event.target, event.eventPhase === 1);
  if (!queue.length) return;

  before(event, 'stopPropagation', trackPropagation);
  before(event, 'stopImmediatePropagation', trackImmediate);
  defineCurrentTarget(event, getCurrentTarget);

  for (var i = 0, len1 = queue.length; i < len1; i++) {
    if (propagationStopped.get(event)) break;
    var matched = queue[i];
    currentTargets.set(event, matched.node);

    for (var j = 0, len2 = matched.observers.length; j < len2; j++) {
      if (immediatePropagationStopped.get(event)) break;
      matched.observers[j].data.call(matched.node, event);
    }
  }

  currentTargets.delete(event);
  defineCurrentTarget(event);
}

function on(name, selector, fn) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var capture = options.capture ? true : false;
  var events = capture ? captureEvents : bubbleEvents;

  var selectors = events[name];
  if (!selectors) {
    selectors = new SelectorSet();
    events[name] = selectors;
    document.addEventListener(name, dispatch, capture);
  }
  selectors.add(selector, fn);
}

function off(name, selector, fn) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var capture = options.capture ? true : false;
  var events = capture ? captureEvents : bubbleEvents;

  var selectors = events[name];
  if (!selectors) return;
  selectors.remove(selector, fn);

  if (selectors.size) return;
  delete events[name];
  document.removeEventListener(name, dispatch, capture);
}

function fire(target, name, detail) {
  return target.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    cancelable: true,
    detail: detail
  }));
}

/*

  # Description

  A light jQuery replacement that takes a selector and returns an instance with helper methods.

  # API

  ## event delegation

  $.on('click', '.js-button', func);
  $.off('click', '.js-button', func);
  $.fire(image, 'robot:singularity', {name: 'Hubot'});

  ## instance methods

  // get ONLY first elem (as an array)
  $(".button:first")

  // get all matching elems as an array
  $(".button").arr;

  // listen for events on matching elems (an alias for addEventListener)
  $(".elem").on("click", func)

  // loop through all matching elements
  $(".button").arr.forEach(func);

  // get first elem as a DOM Node
  $(".button").get(0); 

  // return undefined when index is out of bounds
  $(".button").get(999); // -> undefined 

  // attach data to a all matching elems
  $(".elem").data("keyName", anything)

  // get data from ONLY the first matching elem
  $(".elem").data("keyName")

  ## util

  // convert an array-like object into an array
  $.arr(arrLike) 

  // set data directly on an elem
  $.data(elem, "keyName", anything)

*/

var $$1 = function (selector) {
  return new QueryObj(selector);
};

$$1.on = on;
$$1.off = off;
$$1.fire = fire;

let data = [];
$$1.data = function (elem, key, value) {
  if (!elem || !key) {
    return;
  }

  // get data:
  if (!value) {
    let match = data.find(item => item.elem === elem && item.key === key);
    return match && match.value;
  } 
  
  // set data:
  if (value) {
    let existingIndex = data.findIndex(item => item.elem === elem && item.key === key);
    
    if (existingIndex > -1) {
      data.splice(existingIndex, 1);
    }

    data.push({key, value, elem});
  } 
};

$$1.arr = function (arrLike) {
  if (arrLike === null || arrLike === undefined) {
    return [];
  } else {
    return Array.from(arrLike);
  }
};

class QueryObj {
  constructor(selector) {
    let nodeList = document.querySelectorAll(selector);
    let nodeListArr = Array.from(nodeList);

    if (selector.endsWith(":first")) {
      nodeListArr = nodeListArr.slice(0,1);
    }

    this.arr = nodeListArr;
  }
  get(index) {
    if (index === undefined) {
      return this.arr;
    }
    try {
      return this.arr[index];
    } catch (err) {
      return undefined;
    }
  }
  data(key, value) {
    for (var i = 0; i < this.arr.length; i++) {
      let elem = this.arr[i];
      
      $$1.data(elem, key, value);
    }
  }
  on(name, cb) {
    this.arr.forEach(el => {
      el.addEventListener(name, cb);
    });
  }
}

window.$ = $$1;

// TRAVERSING & ASSEMBLING DOM UTILS

function forEachAncestorMatch ({elem, selector, callback}) {
  let matchingElem = elem.closest(selector);

  if (matchingElem) {
    callback(matchingElem);

    let matchingElemParent = matchingElem.parentNode;
    if (matchingElemParent) {
      forEachAncestorMatch({elem: matchingElemParent, selector, callback});
    }
  }
}


// get an element's parents, optionally filtering them by a selector
function getParents ({elem, selector, includeCurrentElement}) {
  let parents = [];

  if (!includeCurrentElement) {
    elem = elem.parentNode;
  }

  for ( ; elem && elem !== document; elem = elem.parentNode ) {
    if (!selector || (selector && elem.matches(selector))) {
      parents.push(elem);
    }
  }

  return parents;
}

// recursively search inside all parent elements for a selector
function findInParents (elem, selector) {
  let foundElem = elem.parentElement.querySelector(selector);
  if (foundElem || elem.parentElement === document.documentElement) {
    return foundElem;
  } else {
    return findInParents(elem.parentElement, selector);
  }
}


// LOOPING OVER ELEMENT ATTRIBUTES

function forEachAttr (elem, fn) {
  let attributes = elem.attributes;
  let attributesLength = attributes.length;

  for (var i = 0; i < attributesLength; i++) {
    let attrName = attributes[i].name;
    let attrValue = attributes[i].value;

    fn(attrName, attrValue);
  }
}


// ELEMENT POSITION

function getElementOffset (el) {
  let clientRect = el.getBoundingClientRect();
  let top = clientRect.top + window.pageYOffset;
  let left = clientRect.left + window.pageXOffset;
  let right = clientRect.width + left;
  let bottom = clientRect.height + top;
  let width = right - left;
  let height = bottom - top;

  return {
    top: top,
    right: right,
    bottom: bottom,
    left: left,
    width: width,
    height: height
  };
}

// Parses strings that can have multiple parameters and sub-parameters embedded

// This function removes all spaces from a string if, and only if, they are inside a parenthesis
// 1 split string into a letters array
// 2 loop through letters
// 3 if letter is "(", set flag to true
// 4 if letter is ")", set flag to false
// 5 if flag is set to true and letter is a space, remove the space
// 6 combine all letters into a final string
function removeSpacesInParentheses (str) {
  let letters = str.split("");
  let newLetters = [];

  let inParentheses = false;
  for (let i = 0; i < letters.length; i++) {
    let currentLetter = letters[i];

    if (currentLetter === "(") {
      inParentheses = true;
    } else if (currentLetter === ")") {
      inParentheses = false;
    } else if (inParentheses && currentLetter === " ") {
      currentLetter = "";
    }

    newLetters.push(currentLetter);
  }
  
  return newLetters.join("");
}

// trims string, replaces multiple spaces with single spaces
function formatSpaces (str) {
  return str.trim().replace(/  +/g, " ");
}

function parseAttributeString(attributesString) {
  let formattedString = removeSpacesInParentheses(formatSpaces(attributesString)); // => "switchName(no-auto,parent) switchName2(auto,parent)"
  let separatedParamSections = formattedString.split(" "); // => ["switchName(no-auto,parent)", "switchName2(auto,parent)"]
  let separatedAllParams = separatedParamSections.map((str) => str.replace(/\s|\)/g, "").split(/\(|,/)); // => [["switchName", "no-auto", "parent"], ["switchName2", "auto", "parent"]]

  return separatedAllParams;
}

// this parses multiple *repeating* parameters, each with possible *sub-parameters*
function makeParseFunction (attributeName, keyNames) {
  return function parseFunction (elem) { 
    let attributesString = elem.getAttribute(attributeName); // e.g. "switchName(no-auto, parent) switchName2(auto, parent)"

    if (!attributesString) {
      return [];
    }

    let parsedAttributeValues = parseAttributeString(attributesString); // e.g. [["switchName", "no-auto", "parent"], ["switchName2", "auto", "parent"]]        

    return parsedAttributeValues.map(function (arrayOfValues) {
      let returnObj = {};
      keyNames.forEach(function (keyName, index) {
        let val = arrayOfValues[index];
        if (val) {
          returnObj[keyName] = arrayOfValues[index];
        }
      });
      return returnObj;
    });
  }
}

let parseSwitchAttributes = makeParseFunction("data-switches", ["name", "auto", "customName"]);
let parseSwitchActionAttributes = makeParseFunction("data-switch-actions", ["name", "type", "context"]);
let parseSwitchStopAttributes = makeParseFunction("data-switch-stop", ["name"]);
let parseSwitchedOnAttributes = makeParseFunction("data-switched-on", ["name"]);

function parseStringWithIndefiniteNumberOfParams (attributesString) {
  if (!attributesString) {
    return [];
  }

  let parsedAttributeValues = parseAttributeString(attributesString); // e.g. [["func1", "1", "2"], ["func2"]]        

  return parsedAttributeValues.map(function (arrayOfValues) {
    return {
      funcName: arrayOfValues[0],
      args: arrayOfValues.slice(1)
    };
  });
}

// this parses multiple parameters that *don't* repeat and *don't* have sub-parameters
function makeSimpleParseFunction (attributeName, keyNames) {
  return function parseFunction (elem) { 
    let attributesString = elem.getAttribute(attributeName);

    if (!attributesString) {
      return {};
    }

    attributesString = formatSpaces(attributesString);
    let parsedAttributeValues = attributesString.split(" "); // e.g. [".btn", "100", "-50", "both", ".btn--small"]

    return parsedAttributeValues.reduce((accumulator, currentValue, index) => {

      let keyName = keyNames[index];

      accumulator[keyName] = currentValue;

      return accumulator;

    }, {});
  }
}

let parseCopyLayoutAttributes = makeSimpleParseFunction("data-copy-layout", ["selectorForPositionTarget", "xOffset", "yOffset", "dimensionsName", "selectorForDimensionsTarget"]);
let parseCopyPositionAttributes = makeSimpleParseFunction("data-copy-position", ["selectorForPositionTarget", "xOffset", "yOffset"]);
let parseCopyDimensionsAttributes = makeSimpleParseFunction("data-copy-dimensions", ["selectorForDimensionsTarget", "dimensionsName"]);

function getAttributeValueAsArray (elem, attributeName) {
  // get the value of the attribute
  let attributesString = elem.getAttribute(attributeName);

  // if it's an empty string or doesn't exist, return an empty array
  if (!attributesString) {
    return [];
  }

  // trim and replace duplicate spaces
  attributesString = formatSpaces(attributesString);

  // return an array of the "words" in the string
  return attributesString.split(" ");
}


// -------------------------------------------------------------------------
//    advanced attribute parsing (supports args that have spaces in them!)
// -------------------------------------------------------------------------

let regexForPhrase = /^[^\(\):,]+$/;
let regexForPhraseOrSpecialCharacter = /([^\(\):,]+|[\(\):,]|)/g;

function getParts (attributeString) {
  return attributeString.match(regexForPhraseOrSpecialCharacter);
}

function assembleResult (parts) {
  let currentObject;
  let extractedObjects = [];
  let isWithinParens = false;
  let hasModifierBeenProcessed = false;

  parts.forEach((currentPart, index) => {
    let previousPart = parts[index - 1];
    let nextPart = parts[index + 1];

    if (!currentPart) {
      // remove empty strings
      return;
    }

    if (previousPart === "(") {
      isWithinParens = true;
    }

    if (previousPart === ":" || (previousPart === "(" && nextPart !== ":" && nextPart !== ")")) {
      hasModifierBeenProcessed = true;
    }

    if (currentPart === ")") {
      currentObject = undefined;
      isWithinParens = false;
      hasModifierBeenProcessed = false;
    }

    if (regexForPhrase.test(currentPart) && nextPart === "(") {
      // create new object and add it to final array
      currentObject = {};
      extractedObjects.push(currentObject);

      // this part is the "name" if it comes right before "("
      currentObject.name = currentPart.trim();
    }

    if (previousPart === "(" && (nextPart === ":" || nextPart === ")")) {
      // this part is the "modifier" if it comes right after "(" and right before ":"
      if (regexForPhrase.test(currentPart)) {
        currentObject.modifier = currentPart.trim();
      }
    }

    if (isWithinParens && hasModifierBeenProcessed && regexForPhrase.test(currentPart)) {
      currentObject.args = currentObject.args || [];
      // it's one of the `args` if the modifier doesn't exist or has been processed and it's not a comma and it's before a ")"
      currentObject.args.push(currentPart.trim());
    }
  });

  return extractedObjects;
}

function processAttributeString (attributeString) {
  let parts = getParts(attributeString);
  let extractedObjects = assembleResult(parts);

  return extractedObjects;
}

// Copy Layout Plugin
// =====================
//
// [data-copy-layout]
//   - set the position of the target element to the position of the clicked element
//   - set the width and height of the target element to the dimensions of the clicked element
//   - (optional) set the width and height of a different target element to the dimensions of the clicked element
// 
// [data-copy-position]
//   - set the position of the target element to the position of the clicked element
// 
// [data-copy-dimensions]
//   - set the width and height of the target element to the dimensions of the clicked element
//

let lookupParser = [
  {
    selector: "[data-copy-layout]",
    parser: parseCopyLayoutAttributes,
    name: "both"
  },
  {
    selector: "[data-copy-position]",
    parser: parseCopyPositionAttributes,
    name: "position"
  },
  {
    selector: "[data-copy-dimensions]",
    parser: parseCopyDimensionsAttributes,
    name: "dimensions"
  }
];

// Full specification for element with [data-copy-layout] attribute:
// 
// selectorForPositionTarget
// - target to copy position to
// - e.g. ".abc" or "#xyz" (any selector)
// 
// xOffset
// - x-offset
// - e.g. -30 or 42 (any integer)
// 
// yOffset
// - y-offset
// - e.g. -20 or 21 (any integer)
// 
// dimensionsName
// - dimension name to copy
// - e.g. "height" or "width" or "both"
// 
// selectorForDimensionsTarget
// - target to copy dimensions to
// - e.g. ".abc" or "#xyz" (any selector)
// 

$$1.on("click", "[data-copy-layout], [data-copy-position], [data-copy-dimensions]", (event) => {
  let sourceElement = event.currentTarget;

  // parse position/dimensions attributes of source element as a list
  let listOfElementLayoutData = getListOfElementLayoutData(sourceElement);

  // loop through list of layout data 
  listOfElementLayoutData.forEach(({
    selectorForPositionTarget,
    xOffset,
    yOffset,
    dimensionsName,
    selectorForDimensionsTarget,
    copyMethod
  }) => {

    // get offset data for the source element, so we can use it in both functions, i.e. copyDimensions AND copyPosition
    let sourceElementOffsetData = getElementOffset(sourceElement);

    // check if we're copying dimensions
    if (copyMethod === "dimensions" || copyMethod === "both") {

      // if we don't have a dimensions target, set the target to the position's target (because that's the default)
      if (!selectorForDimensionsTarget) {
        selectorForDimensionsTarget = selectorForPositionTarget;
      }

      // copy the dimensions from the source element onto the dimension's target
      copyDimensions(sourceElementOffsetData, selectorForDimensionsTarget, dimensionsName);

    }

    // check if we're copying position
    if (copyMethod === "position" || copyMethod === "both") {

      // copy the position from the source element onto the position target
      copyPosition(sourceElementOffsetData, selectorForPositionTarget, xOffset, yOffset);

    }

  });

});


function getListOfElementLayoutData (sourceElement) {
  let parsedData = [];

  lookupParser.forEach((parser) => {

    // figure out the parser to use
    if (sourceElement.matches(parser.selector)) {

      // parse the attributes on the element
      let elemData = parser.parser(sourceElement); // e.g. {"selectorForPositionTarget", "xOffset", "yOffset", "dimensionsName", "selectorForDimensionsElTarget

      // get the copy method
      elemData.copyMethod = parser.name;

      if (elemData.xOffset) {
        elemData.xOffset = parseInt(elemData.xOffset, 10);
      }

      if (elemData.yOffset) {
        elemData.yOffset = parseInt(elemData.yOffset, 10);
      }
      
      parsedData.push(elemData); 
    }

  });

  // return an array with all the parsed attributes
  return parsedData; // e.g. [{copyMethod, selectorForPositionTarget, xOffset, yOffset, dimensionsName, selectorForDimensionsElTarget
}


function copyDimensions (sourceElementOffsetData, selectorForDimensionsTarget, dimensionsName) {
  // get the new width and height data we want to set
  let {width, height} = sourceElementOffsetData;

  // loop through the target elements
  $$1(selectorForDimensionsTarget).arr.forEach((targetElem) => {

    // if copying the width, set a new width
    if (dimensionsName === "width" || dimensionsName === "both") {
      targetElem.style.width = width + "px";
    }

    // if copying the height, set a new height
    if (dimensionsName === "height" || dimensionsName === "both") {
      targetElem.style.height = height + "px";
    }
  });
}


function copyPosition (sourceElementOffsetData, selectorForPositionTarget, xOffset = 0, yOffset = 0) {
  // get the new position data we want to set
  let {left, top} = sourceElementOffsetData;
  left += xOffset;
  top += yOffset;

  // loop through the target elements 
  $$1(selectorForPositionTarget).arr.forEach((targetElem) => {

    // set a new top position
    targetElem.style.top = top + "px";

    // set a new left position
    targetElem.style.left = left + "px";

  });
}

// for external use. the other methods would need to be adapted before they're exported
function copyLayout ({sourceElem, targetElem, dimensionsName = "width", xOffset = 0, yOffset = 0} = {}) {
  let sourceElemOffsetData = getElementOffset(sourceElem);

  // copy position
  let {left, top} = sourceElemOffsetData;
  left += xOffset;
  top += yOffset;
  targetElem.style.top = top + "px";
  targetElem.style.left = left + "px";

  // copy dimensions
  let {width, height} = sourceElemOffsetData;
  if (dimensionsName === "width" || dimensionsName === "both") {
    targetElem.style.width = width + "px";
  }
  if (dimensionsName === "height" || dimensionsName === "both") {
    targetElem.style.height = height + "px";
  }
}

function isStringANumber (str) {
  return /^\d+$/.test(str);
}

// won't work with consecutive hyphens
function dashToCamelCase(str) {
  return str.replace(/-([a-z])/g, (match) => match[1].toUpperCase());
}

// won't work with two consecutive uppercase letters e.g. "thisIsABundle"
function camelCaseToDash (str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Turn on, off, or toggle multiple switches by clicking an action trigger element

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
      let allSwitchElements = $$1(selector).arr;
      switchElements = allSwitchElements.splice(positionNumber, 1); // splice will return elem at `positionNumber` index and wrap it an array
    }
  } else {
    switchElements = $$1(selector).arr;
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
  triggerCallbacks(switchObj, actionObj);
} 

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
  triggerCallbacks(switchObj, actionObj);
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
  let turnedOnSwitchElements = $$1("[data-switched-on]").arr;

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


var Switches = {
  isOn,
  turnOn, 
  turnOff,
  toggle,
  when
};

function parseNode (elem, isParentDataAnObject) { 
  let elemType = elem.getAttribute("data-o-type"); // elemType can be `object` or `list`

  return {
    elemType: elemType,
    key: isParentDataAnObject ? elem.getAttribute("data-o-key") : null,
    value: elemType === "list" ? [] : getDataFromNode(elem)
  };
}

// Converts:
// <div data-o-key-example1="1" data-o-key-example2="2"></div>
// Into:
// {example1: "1", example2: "2"}
function getDataFromNode (elem) {
  let keyPrefix = "data-o-key-";
  let locationKeyPrefix = "data-l-key-";
  let keyPrefixLength = keyPrefix.length;

  let returnObj = {};

  forEachAttr(elem, (attrName, attrValue) => {
    if (attrName.indexOf(keyPrefix) === 0) {

      let keyName = attrName.substring(keyPrefixLength);
      let camelCaseKeyName = dashToCamelCase(keyName);

      returnObj[camelCaseKeyName] = attrValue;
      
    } else if (attrName.indexOf(locationKeyPrefix) === 0) {

      let keyName = attrName.substring(keyPrefixLength);
      let camelCaseKeyName = dashToCamelCase(keyName);
      
      attrValue = getLocationKeyValue(elem, keyName, attrValue);
      returnObj[camelCaseKeyName] = attrValue;

    }
  });

  return returnObj;
}

// 1. Find the CLOSEST `[data-o-type="object"]`
// 2. Get this element's data keys and their values
// 3. Add these key/values into an object (lower/earlier keys always overwrite higher ones)
// 4. Start again at (a) until it returns null and you have a full object
function getDataAndDataSourceElemFromNodeAndAncestors (elem) {
  let collectedData = {};
  let selector = '[data-o-type="object"]';

  forEachAncestorMatch({
    elem: elem,
    selector: selector, 
    callback: function (matchingElem) {
      let nodeData = getDataFromNode(matchingElem);

      // add source element
      Object.keys(nodeData).forEach((camelCaseKeyName) => {
        let value = nodeData[camelCaseKeyName];
        nodeData[camelCaseKeyName] = {value, dataSourceElem: matchingElem};
      });

      // earlier data, i.e. collectedData, always overwrites new data
      // this is because keys closer to the search source are more likely to belong to it
      collectedData = Object.assign(nodeData, collectedData);
    }
  });

  return collectedData; // e.g. {exampleTitle: {value: "Hello There!", dataSourceElem}}
}

// helper function, has repeated code from getLocationKeyValue() and setLocationKeyValue()
function getDataFromLocationString (elem, dashCaseKeyName, locationString) {
  locationString = formatSpaces(locationString);
  let [selector, elemAttribute] = locationString.split(" "); // e.g. [".selector", "attr:data-x-text"]
  let targetElem;

  if (!selector || selector === "." || elem.matches(selector)) {
    targetElem = elem;
  } else if (selector === "target") {
    let defaultTargetSelector = `[data-l-target-${dashCaseKeyName}]`;
    if (elem.matches(defaultTargetSelector)) {
      targetElem = elem;
    } else {
      targetElem = elem.querySelector(defaultTargetSelector); // e.g. dashCaseKeyName = "page-title"
    }
  } else {
    targetElem = elem.querySelector(selector);
  }

  return {elemAttribute, targetElem};
}

function getLocationKeyValue (elem, dashCaseKeyName, locationString) {
  let {elemAttribute, targetElem} = getDataFromLocationString(elem, dashCaseKeyName, locationString);
  elemAttribute = elemAttribute || "innerText"; // default to innerText
  let elemValue;
  
  if (elemAttribute.indexOf("attr:") === 0) {
    elemAttribute = elemAttribute.substring(5);
    elemValue = targetElem && targetElem.getAttribute(elemAttribute);
  } else {
    elemValue = targetElem && targetElem[elemAttribute]; // e.g. elem["innerText"]
  }

  return typeof elemValue === "string" ? elemValue.trim() : "";
}

// use like this: setLocationKeyValue(elem, ".selector", "example text")
                                              // ^ this will default to setting innerText if there's no 2nd argument
function setLocationKeyValue (elem, dashCaseKeyName, locationString, value) {
  let {elemAttribute, targetElem} = getDataFromLocationString(elem, dashCaseKeyName, locationString);
  elemAttribute = elemAttribute || "innerText"; // default to innerText

  if (targetElem) {
    let valueTrimmed = value.toString().trim();

    if (elemAttribute.indexOf("attr:") === 0) {
      elemAttribute = elemAttribute.substring(5);
      targetElem.setAttribute(elemAttribute, valueTrimmed);
    } else {
      targetElem[elemAttribute] = valueTrimmed;
    }
  }
}

// utility function for setting a value on a data attribute
// using a key name that could be EITHER a location key or an output key
function setValueForKeyName (elem, keyName, value) {
  // convert the key name to output and location format
  let dashCaseKeyName = camelCaseToDash(keyName);
  let outputAttr = "data-o-key-" + dashCaseKeyName;
  let locationAttr = "data-l-key-" + dashCaseKeyName;
  // if the output format is found, set the value of that attribute
  if (elem.hasAttribute(outputAttr)) {
    elem.setAttribute(outputAttr, value);
  }
  // if the location format is found, set the value using `setLocationKeyValue`
  if (elem.hasAttribute(locationAttr)) {
    let locationString = elem.getAttribute(locationAttr);
    setLocationKeyValue(elem, dashCaseKeyName, locationString, value);
  }
}

function createDataObjectFromElement (elem) {
  let nodeData = parseNode(elem, false);
  return nodeData.value;
}

function addDataFromElementToDataObject (elem, parentData) {
  let isParentDataAnObject = !Array.isArray(parentData);
  let nodeData = parseNode(elem, isParentDataAnObject);

  if (isParentDataAnObject) {
    if (nodeData.key) {
      parentData[nodeData.key] = nodeData.value;
      return nodeData.value;
    } else {
      Object.assign(parentData, nodeData.value);
      return parentData;
    }
  } else {
    parentData.push(nodeData.value);
    return nodeData.value;
  }
}

// special properties:
// * data-o-type (attribute value can be "object" or "list")
// * data-o-key (attribute value can be any string, but ideally camel cased with no spaces)
// * data-o-value (attribute value can be any string)


function getDataFromRootNode (rootNode) {

  let rootData;

  function getDataFromDom (currentElement, parentData) {

    // can this element's data be parsed?
    let canElementDataBeParsed = currentElement.hasAttribute("data-o-type"); 

    // if element's data can be parsed, add its data to the current tree of data
    // otherwise, skip it
    if (canElementDataBeParsed) {

      // if there's parent data, add the element's data to it
      // and re-assign parentData to this new iteration's data
      if (parentData) {
        parentData = addDataFromElementToDataObject(currentElement, parentData);
      }

      // if there's no parent data, create new parent data
      if (!parentData && !rootData) {

        // create new parent data
        parentData = createDataObjectFromElement(currentElement);

        // it will also be the original data, since this is the first time through
        rootData = parentData;

      } else if (!parentData && rootData) {

        // special orphaned data case:
        //   instead of letting orphan data (i.e. two or more objects that don't share 
        //   a single parent) overwrite the root data, merge it in with the current root data
        parentData = addDataFromElementToDataObject(currentElement, rootData);

      }

    }

    // pass all the collected data to the next iteration
    let children = currentElement.children;
    for (var i = 0; i < children.length; i++) {
      getDataFromDom(children[i], parentData);
    }

    // after all the iterations, the original data should have all the parsed data from the DOM
    return rootData;

  }

  return getDataFromDom(rootNode);

}

let elemProps = ["id", "className", "type", "src", "value", "checked", "innerText", "innerHTML", "style", "title", "alt", "for", "placeholder"];

var optionsData = {
  // default watch functions
  watchFunctions: {
    "*": function ({watchElem, watchAttrName, camelCaseKeyName, value, dataSourceElem, watchFuncName, watchFuncArgs, dataTargetElem}) {
      // if func is a valid property, set the first arg as its value
      if (elemProps.includes(watchFuncName)) {
        watchElem[watchFuncName] = value;
      }

      // if func is a data attribute, set the first arg as its value
      if (watchFuncName.startsWith("data-")) {
        watchElem.setAttribute(watchFuncName, value);
      }
    }
  }
};

// README
// - watch functions are named inside watch attributes and defined inside app code. they run 
//   usually when the page loads, but not always. they ALWAYS run when data is synced to a data
//   key that matches their own key 
//     (e.g. a sync to `data-o-key-name` will trigger => `data-w-key-name`)

// TIPS
// - if you want a watch function to run every time data in synced, but not on page load, give
//   it a watch attribute, but not a `data-w` attribute.

// WARNING
// - watch attrs must be inside or on their data elements. they can't watch data inside themselves


function getValueAndDataSourceElemFromKeyName (elem, dashCaseKeyName) {
  // 1. construct the attribute names
  let outputDataAttributeName = "data-o-key-" + dashCaseKeyName; // e.g. "data-o-key-book-title"
  let locationDataAttributeName = "data-l-key-" + dashCaseKeyName; // e.g. "data-l-key-book-title"

  // 2. get the closest element with a matching data attribute (location or output)
  let selector = `[${outputDataAttributeName}], [${locationDataAttributeName}]`;
  let dataSourceElem = elem.closest(selector);

  // 3. get the value from the matching attribute
  let hasOutputDataAttribute = dataSourceElem.hasAttribute(outputDataAttributeName);
  if (hasOutputDataAttribute) {
    return {
      dataSourceElem,
      value: dataSourceElem.getAttribute(outputDataAttributeName)
    };
  } else {
    let locationString = dataSourceElem.getAttribute(locationDataAttributeName);
    return {
      dataSourceElem,
      value: getLocationKeyValue(dataSourceElem, dashCaseKeyName, locationString)
    };
  }
}

// callWatchFunctionsOnElem
// -----------------------
//
// # What does it do?
// It's called from `syncData.js` after data has been synced. Any keys that are synced that match
// a watch attribute cause the functions listed in the watch attribute to be called.
// 
// I.E.
// watchElem: the element with the watch attribute on it
// watchAttrName: the full name of the watch attribute, e.g. data-w-key-title
// value: the new value being set / synced
// dataSourceElem: the element that the value comes from, if there is one
// dataTargetElem: the element that the value is synced into -- not necessarily the watchElem
function callWatchFunctionsOnElem ({watchElem, watchAttrName, value, dataSourceElem, dataTargetElem}) {

  // get camel case key name
  let camelCaseKeyName = dashToCamelCase(watchAttrName.substring("data-w-key-".length));

  // get the string to be parsed
  let watchAttributeString = watchElem.getAttribute(watchAttrName);

  // parses the watch attribute into a series of function/argument pairs
  //   e.g. [{funcName: "func1", args: ["1", "2"]}, {funcName: "func2", args: []}]
  let listOfFunctionsWithTheirArguments = parseStringWithIndefiniteNumberOfParams(watchAttributeString);

  // call each watch function
  listOfFunctionsWithTheirArguments.forEach(function ({funcName, args}) {
    let watchFunc = optionsData.watchFunctions && (optionsData.watchFunctions[funcName] || optionsData.watchFunctions["*"]);
    
    watchFunc({
      watchElem, 
      watchAttrName, 
      camelCaseKeyName,
      value, 
      dataSourceElem,
      watchFuncName: funcName,
      watchFuncArgs: args,
      dataTargetElem
    });
  });
}


// # What does it do?
// Takes an array of watch elements, loops through them, then loops through all their attributes,
// gets all the watch attributes and calls them, using the closest output attribute as a data
// source.
//
// # Note: it doesn't loop through child elements.
//
// # When is it called?
// Called, for example, on page load. Or when a new element is added to the page that has watch
// data attributes on it.
//
// e.g.
// callMultipleWatchFunctions($("[data-w]").arr)
//
//     watchElems: <div data-w data-w-key-x="func1 a" data-w-key-y="func2 b"></div>
//
function callMultipleWatchFunctions (watchElems) { 

  // get the watch key prefix
  let keyPrefix = "data-w-key-";
  let keyPrefixLength = keyPrefix.length;

  // loop through each watch elem
  watchElems.forEach((watchElem) => {

    // loop through each attribute of the watch elem
    forEachAttr(watchElem, (attrName, attrValue) => {

      // test to see if the attribute is a watch attribute
      if (attrName.indexOf(keyPrefix) === 0) {

        // get dash case key name from watch attribute
        let dashCaseKeyName = attrName.substring(keyPrefixLength); // e.g. book-title

        // get the value to set from closest data source
        let {value, dataSourceElem} = getValueAndDataSourceElemFromKeyName(watchElem, dashCaseKeyName);

        // call the watch function for this attribute, using the value from the closest data source
        callWatchFunctionsOnElem({
          watchElem, 
          watchAttrName: attrName, 
          value, 
          dataSourceElem,
          dataTargetElem: dataSourceElem
        });
      }
    });

  });
}

function getWatchElements ({elementWithData, dashCaseKeyName}) {
  let watchSelector = `[data-w-key-${dashCaseKeyName}]`;
  let nestedWatchSelector = `:scope [data-o-key-${dashCaseKeyName}] [data-w-key-${dashCaseKeyName}]`;

  if (elementWithData.matches(watchSelector)) ;

  let allWatchElements = Array.from(elementWithData.querySelectorAll(watchSelector));
  let nestedWatchElements = Array.from(elementWithData.querySelectorAll(nestedWatchSelector));

  return allWatchElements.filter(el => !nestedWatchElements.includes(el));
}

let afterSyncCallbacks = [];
function afterSync (cb) {
  afterSyncCallbacks.push(cb);
}

function syncDataBetweenElements ({sourceElement, targetElement, shouldTriggerSave}) {

  let elementsDataWasSyncedInto = [];

  // 1. Assemble an object from the source element and its ancestors (L or O)
    // Why look in ancestors for data? because you want to be able to click an edit button anywhere on the page in order to edit the global/root data
  let fullDataObject = getDataAndDataSourceElemFromNodeAndAncestors(sourceElement);

  // 2. Loop through the keys of the assembled object
  Object.keys(fullDataObject).forEach((camelCaseKeyName) => { // e.g. bundleName

    let originalValue = fullDataObject[camelCaseKeyName].value;
    let dataSourceElem = fullDataObject[camelCaseKeyName].dataSourceElem;
    let dashCaseKeyName = camelCaseToDash(camelCaseKeyName);

    // a. Sync location & output keys:
    let {actualValue, closestMatchingElem} = syncToLocationOrOutputKey({targetElement, camelCaseKeyName, dashCaseKeyName, originalValue, dataSourceElem});

    // b. Sync input keys:
    syncToInputKeys({targetElement, camelCaseKeyName, actualValue});

    // c. Store the closestMatchingElem for later
    if (closestMatchingElem && elementsDataWasSyncedInto.indexOf(closestMatchingElem) === -1) {
      elementsDataWasSyncedInto.push(closestMatchingElem);
    }

  });

  // 3. Call after sync callbacks
  callAfterSyncCallbacks({elementsDataWasSyncedInto, sourceElement, targetElement, shouldTriggerSave, data: fullDataObject});

}

// used by saveEventListener.js
  // IMPORTANT: expects an event, not an element
function triggerSyncAndSave (event) {
  event.preventDefault();

  // 2. find the nearest ancestor element that has the attribute `data-i-sync`
  let syncElement = event.currentTarget.closest("[data-i-sync]");

  // make sure data sync happens after all date is in place 
  //   e.g. we might want to have the switch action button also set data 
  //        (we currently do this with the inline edit revisions submit button)
  setTimeout(() => {

    // 3. copy data from the data sync element (and its children) back to the source element
    syncDataBetweenElements({
      sourceElement: syncElement, 
      targetElement: $.data(syncElement, "source"),
      shouldTriggerSave: true
    });

  });
}


// dataSourceElement: this is the element where the data is coming from
function syncToLocationOrOutputKey ({targetElement, camelCaseKeyName, dashCaseKeyName, originalValue, dataSourceElem}) {

  let actualValue;

  // 1. Find _ONE_ CLOSEST matching key on the target element (L or O)
  let dataAttrSelector = `[data-l-key-${dashCaseKeyName}],[data-o-key-${dashCaseKeyName}]`;
  let closestMatchingElem = targetElement.closest(dataAttrSelector);

  // 2. If it exists, replace its value with the value from the assembled object
  if (closestMatchingElem) {
    // the default value is intended to overwrite the value immediately before it's synced into instead of when the data is originally parsed
    // -- note: it's nice having the default attr on the main data source element and it makes parsing nodes more performant
    actualValue = getValueOrDefaultValue(closestMatchingElem, originalValue, dashCaseKeyName);

    setValueForKeyName(closestMatchingElem, camelCaseKeyName, actualValue);

    // 3. Call watch functions
        // IMPORTANT: We use the element that each key is synced into as the element to search for matching watch attributes
    callWatchFunctions({dashCaseKeyName, parentOfTargetElements: closestMatchingElem, value: actualValue, dataSourceElem});
  }

  return {actualValue, closestMatchingElem};

}

function syncToInputKeys ({targetElement, camelCaseKeyName, actualValue}) {

  // 1. Find _ONE_ CHILD elements of the target element that match a `data-i`
    // options: radio, select, checkbox, input, textarea, div
    // how to find: radio.name, select.name, checkbox.name, input.name, div.customAttr
  let matchingKeyElem = targetElement.querySelector(`[data-i][name='${camelCaseKeyName}'], [data-i][data-i-key='${camelCaseKeyName}']`);

  // do nothing if not found
  if (!matchingKeyElem) {
    return;
  }

  // 2. What type of element is it?
    // options: radio, select, checkbox, input, textarea, div
    // how to tell: elem.nodeName for select, textarea, div (this will be fallback default); attr type for radio, checkbox, input (this will be the fallback default)
  let nodeName = matchingKeyElem.nodeName.toLowerCase();  // select, textarea, div, input, other

  if (nodeName === "input") {
    let inputType = matchingKeyElem.getAttribute("type"); // radio, checkbox, text, other

    if (inputType === "radio") {
      let matchingValueElem = targetElement.querySelector(`[type='radio'][name='${camelCaseKeyName}'][value='${actualValue}']`);

      if (!matchingValueElem) {
        return;
      }

      matchingValueElem.checked = true;
    } else if (inputType === "checkbox") {
      if (actualValue) {
        matchingKeyElem.checked = true;
      } else {
        matchingKeyElem.checked = false;
      }
    } else if (inputType === "text" || !inputType) {
      matchingKeyElem.value = actualValue;
    }
  } else if (nodeName === "select" || nodeName === "textarea") {
    matchingKeyElem.value = actualValue;
  }

}

function callWatchFunctions ({dashCaseKeyName, parentOfTargetElements, value, dataSourceElem}) {
  
  // 1. Find ALL CHILD elements of the target element that match a `data-w-key` UNLESS they're children of another matching data-o-key element
  let watchElems = getWatchElements({elementWithData: parentOfTargetElements, dashCaseKeyName});

  watchElems.forEach((watchElem) => {
    // 2. Call all the watch functions defined by this attribute
    callWatchFunctionsOnElem({
      watchElem, 
      watchAttrName: `data-w-key-${dashCaseKeyName}`, 
      value: value, 
      dataSourceElem: dataSourceElem,
      dataTargetElem: parentOfTargetElements
    });      
  });

}

function callAfterSyncCallbacks ({elementsDataWasSyncedInto, sourceElement, targetElement, shouldTriggerSave, data}) {
  if (afterSyncCallbacks.length > 0) {
    afterSyncCallbacks.forEach((afterSyncCallback) => {
      afterSyncCallback({elementsDataWasSyncedInto, sourceElement, targetElement, shouldTriggerSave, data});
    });
  }
}


// helpers 

function isValueEmpty (value) {
  return !value || /^\s*$/.test(value);
}

function getDefaultValue (elem, dashCaseKeyName) {
  return elem.getAttribute("data-o-default-" + dashCaseKeyName) || "";
}

function getValueOrDefaultValue (elem, value, dashCaseKeyName) {
  return isValueEmpty(value) ? getDefaultValue(elem, dashCaseKeyName) : value;
}

function initInboundDataSyncEventListener () {
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
          $$1.data(switchObj.elem, "source", actionObj.elem);

        }
        
      });
    }
  });
}

// PREFER USING THIS OVER THE "CLICK TO SAVE" IF THE DATA CAN BE PLACED IN AN INLINE EDIT FORM

function initSaveEventListener () {

  // 1. watch for when a form with `data-i-sync` on it is submitted, either by pressing a `data-i-save` button or maybe by pressing enter in an input
  $$1.on("submit", "[data-i-sync]", triggerSyncAndSave);

  $$1.on("click", "[data-i-sync] [data-i-trigger-sync]", triggerSyncAndSave);

}

function ajax ({url, method, data, callback}) {
  fetch(url, {
    method: method,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(data),
  })
  .then(res => res.json())
  .then(res => {
    callback(res);
  });
}

function ajaxSimple (url, method, data, callback) {
  ajax({url, method, data, callback});
}

function ajaxPost (url, data, callback) {
  ajaxSimple(url, "POST", data, callback);
}

let onSaveFunctions = {
  // default save function posts data to /save endpoint
  all: function (data) {
    ajaxPost("/save", {data}, function (res) {});
  }
};

function initSaveFunctions (saveFunctions) {
  Object.assign(onSaveFunctions, saveFunctions);
}

function enableSaveAttribute (afterSync) {
  afterSync(function ({elementsDataWasSyncedInto, targetElement, shouldTriggerSave}) {
    if (shouldTriggerSave) {
      elementsDataWasSyncedInto.forEach((elementDataWasSyncedInto) => {
        callSaveFunction({elementDataWasSyncedInto});
      });
    }
  });
}

function callSaveFunction ({elementDataWasSyncedInto, targetElement}) {
  // allow alternate names: use `elementDataWasSyncedInto` when syncing, user `targetElement` when creating new data or removing data
  elementDataWasSyncedInto = elementDataWasSyncedInto || targetElement;
  let saveElement = elementDataWasSyncedInto.closest("[data-o-save-deep], [data-o-save]");
    
  if (saveElement) {
    let shouldParseChildElements = saveElement.matches("[data-o-save-deep]");

    if (shouldParseChildElements) {
      let saveType = saveElement.getAttribute("data-o-save-deep");
      let saveFunc = onSaveFunctions[saveType];

      if (saveFunc) {
        let dataFromSaveElement = getDataFromRootNode(saveElement);
        saveFunc(dataFromSaveElement, elementDataWasSyncedInto);
      }
    } else {
      let saveType = saveElement.getAttribute("data-o-save");
      let saveFunc = onSaveFunctions[saveType];

      if (saveFunc) {
        let dataFromSaveElement = getDataFromNode(saveElement);
        saveFunc(dataFromSaveElement, elementDataWasSyncedInto);
      }
    }
  }
}

function initRemoveAndHideEventListeners () {

  // useful for permanently removing items, especially from a list of similar items
  $$1.on("click", "[data-i-remove]", function (event) {

    // 1. find the nearest ancestor element that has the attribute `data-i-sync`
    let syncElement = event.currentTarget.closest("[data-i-sync]");

    // 2. get the closest element with data on it
    let sourceElement = $$1.data(syncElement, "source");
    let elemWithData = sourceElement.closest('[data-o-type="object"]');

    // 3. get parent element (because we can't call the save function on an elem that doesn't exist)
    let parentElem = elemWithData.parentNode;

    // 4. remove the data element
    elemWithData.remove();

    // 5. save data
    callSaveFunction({targetElement: parentElem});

  });

  // useful for hiding items the user doesn't want visible, but allowing them to add them back later
  $$1.on("click", "[data-i-hide]", function (event) {

    // 1. find the nearest ancestor element that has the attribute `data-i-sync`
    let syncElement = event.currentTarget.closest("[data-i-sync]");

    // 2. look through the data keys and set ALL their values to empty strings
    forEachAttr(syncElement, function (attrName, attrValue) {
      if (attrName.startsWith("data-o-key-")) {
        syncElement.setAttribute(attrName, "");
      }
    });

    // 3. save all the data as empty strings
    triggerSyncAndSave(event);

  });

}

function initChoiceAndToggleEventListeners () {

  // plain choice, using a <div> or <button> or <a>
  $$1.on("click", "[data-i][data-i-key][data-i-value]", function (event) {
    // get key name and value we want to change
    let keyName = event.currentTarget.getAttribute("data-i-key");
    let attributeValue = event.currentTarget.getAttribute("data-i-value");

    // set value
    setValue({elem: event.currentTarget, keyName, attributeValue});
  });


  // <radio> AND <select>
  $$1.on("change", "[data-i][type='radio'], select[data-i]", function (event) {
    // get key name and value we want to change
    let keyName = event.currentTarget.getAttribute("name");
    let attributeValue = event.currentTarget.value;

    // set value
    setValue({elem: event.currentTarget, keyName, attributeValue});
  });


  // <checkbox>
  $$1.on("change", "[data-i][type='checkbox']", function (event) {
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

function initInputElementEventListener () {

  // <input> and <textarea>
  $$1.on("input", "input[data-i], textarea[data-i]", function (event) {
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

function initClickToSaveEventListener () {
  $$1.on("click", "[data-i-click-to-save]", function (event) {

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

const map = (typeof Map === "function") ? new Map() : (function () {
	const keys = [];
	const values = [];

	return {
		has(key) {
			return keys.indexOf(key) > -1;
		},
		get(key) {
			return values[keys.indexOf(key)];
		},
		set(key, value) {
			if (keys.indexOf(key) === -1) {
				keys.push(key);
				values.push(value);
			}
		},
		delete(key) {
			const index = keys.indexOf(key);
			if (index > -1) {
				keys.splice(index, 1);
				values.splice(index, 1);
			}
		},
	}
})();

let createEvent = (name)=> new Event(name, {bubbles: true});
try {
	new Event('test');
} catch(e) {
	// IE does not support `new Event()`
	createEvent = (name)=> {
		const evt = document.createEvent('Event');
		evt.initEvent(name, true, false);
		return evt;
	};
}

function assign(ta) {
	if (!ta || !ta.nodeName || ta.nodeName !== 'TEXTAREA' || map.has(ta)) return;

	let heightOffset = null;
	let clientWidth = null;
	let cachedHeight = null;

	function init() {
		const style = window.getComputedStyle(ta, null);

		if (style.resize === 'vertical') {
			ta.style.resize = 'none';
		} else if (style.resize === 'both') {
			ta.style.resize = 'horizontal';
		}

		if (style.boxSizing === 'content-box') {
			heightOffset = -(parseFloat(style.paddingTop)+parseFloat(style.paddingBottom));
		} else {
			heightOffset = parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
		}
		// Fix when a textarea is not on document body and heightOffset is Not a Number
		if (isNaN(heightOffset)) {
			heightOffset = 0;
		}

		update();
	}

	function changeOverflow(value) {
		{
			// Chrome/Safari-specific fix:
			// When the textarea y-overflow is hidden, Chrome/Safari do not reflow the text to account for the space
			// made available by removing the scrollbar. The following forces the necessary text reflow.
			const width = ta.style.width;
			ta.style.width = '0px';
			// Force reflow:
			/* jshint ignore:start */
			ta.offsetWidth;
			/* jshint ignore:end */
			ta.style.width = width;
		}

		ta.style.overflowY = value;
	}

	function getParentOverflows(el) {
		const arr = [];

		while (el && el.parentNode && el.parentNode instanceof Element) {
			if (el.parentNode.scrollTop) {
				arr.push({
					node: el.parentNode,
					scrollTop: el.parentNode.scrollTop,
				});
			}
			el = el.parentNode;
		}

		return arr;
	}

	function resize() {
		if (ta.scrollHeight === 0) {
			// If the scrollHeight is 0, then the element probably has display:none or is detached from the DOM.
			return;
		}

		const overflows = getParentOverflows(ta);
		const docTop = document.documentElement && document.documentElement.scrollTop; // Needed for Mobile IE (ticket #240)

		ta.style.height = '';
		ta.style.height = (ta.scrollHeight+heightOffset)+'px';

		// used to check if an update is actually necessary on window.resize
		clientWidth = ta.clientWidth;

		// prevents scroll-position jumping
		overflows.forEach(el => {
			el.node.scrollTop = el.scrollTop;
		});

		if (docTop) {
			document.documentElement.scrollTop = docTop;
		}
	}

	function update() {
		resize();

		const styleHeight = Math.round(parseFloat(ta.style.height));
		const computed = window.getComputedStyle(ta, null);

		// Using offsetHeight as a replacement for computed.height in IE, because IE does not account use of border-box
		var actualHeight = computed.boxSizing === 'content-box' ? Math.round(parseFloat(computed.height)) : ta.offsetHeight;

		// The actual height not matching the style height (set via the resize method) indicates that 
		// the max-height has been exceeded, in which case the overflow should be allowed.
		if (actualHeight < styleHeight) {
			if (computed.overflowY === 'hidden') {
				changeOverflow('scroll');
				resize();
				actualHeight = computed.boxSizing === 'content-box' ? Math.round(parseFloat(window.getComputedStyle(ta, null).height)) : ta.offsetHeight;
			}
		} else {
			// Normally keep overflow set to hidden, to avoid flash of scrollbar as the textarea expands.
			if (computed.overflowY !== 'hidden') {
				changeOverflow('hidden');
				resize();
				actualHeight = computed.boxSizing === 'content-box' ? Math.round(parseFloat(window.getComputedStyle(ta, null).height)) : ta.offsetHeight;
			}
		}

		if (cachedHeight !== actualHeight) {
			cachedHeight = actualHeight;
			const evt = createEvent('autosize:resized');
			try {
				ta.dispatchEvent(evt);
			} catch (err) {
				// Firefox will throw an error on dispatchEvent for a detached element
				// https://bugzilla.mozilla.org/show_bug.cgi?id=889376
			}
		}
	}

	const pageResize = () => {
		if (ta.clientWidth !== clientWidth) {
			update();
		}
	};

	const destroy = (style => {
		window.removeEventListener('resize', pageResize, false);
		ta.removeEventListener('input', update, false);
		ta.removeEventListener('keyup', update, false);
		ta.removeEventListener('autosize:destroy', destroy, false);
		ta.removeEventListener('autosize:update', update, false);

		Object.keys(style).forEach(key => {
			ta.style[key] = style[key];
		});

		map.delete(ta);
	}).bind(ta, {
		height: ta.style.height,
		resize: ta.style.resize,
		overflowY: ta.style.overflowY,
		overflowX: ta.style.overflowX,
		wordWrap: ta.style.wordWrap,
	});

	ta.addEventListener('autosize:destroy', destroy, false);

	// IE9 does not fire onpropertychange or oninput for deletions,
	// so binding to onkeyup to catch most of those events.
	// There is no way that I know of to detect something like 'cut' in IE9.
	if ('onpropertychange' in ta && 'oninput' in ta) {
		ta.addEventListener('keyup', update, false);
	}

	window.addEventListener('resize', pageResize, false);
	ta.addEventListener('input', update, false);
	ta.addEventListener('autosize:update', update, false);
	ta.style.overflowX = 'hidden';
	ta.style.wordWrap = 'break-word';

	map.set(ta, {
		destroy,
		update,
	});

	init();
}

function destroy(ta) {
	const methods = map.get(ta);
	if (methods) {
		methods.destroy();
	}
}

function update(ta) {
	const methods = map.get(ta);
	if (methods) {
		methods.update();
	}
}

let autosize = null;

// Do nothing in Node.js environment and IE8 (or lower)
if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
	autosize = el => el;
	autosize.destroy = el => el;
	autosize.update = el => el;
} else {
	autosize = (el, options) => {
		if (el) {
			Array.prototype.forEach.call(el.length ? el : [el], x => assign(x));
		}
		return el;
	};
	autosize.destroy = el => {
		if (el) {
			Array.prototype.forEach.call(el.length ? el : [el], destroy);
		}
		return el;
	};
	autosize.update = el => {
		if (el) {
			Array.prototype.forEach.call(el.length ? el : [el], update);
		}
		return el;
	};
}

var autosize$1 = autosize;

function initEditableAttribute () {
  insertRemakeEditPopoverHtml();

  $$1.on("click", "[data-i-editable], [data-i-editable-with-remove], [data-i-editable-with-hide]", function (event) {
    let editableTriggerElem = event.currentTarget;
    let [ switchName, editableConfigString ] = getEditableInfo(editableTriggerElem);
    let editablePopoverElem = document.querySelector(".remake-edit");
    let editableConfig = processAttributeString(editableConfigString); // [{name, modifier, args: []}]

    // remove old output key attributes
    removeOutputDataAttributes({
      elem: editablePopoverElem,
      keep: []
    });

    // add output key attributes defined in the editable config
    addDataOutputKeys({
      elem: editablePopoverElem, 
      config: editableConfig
    });

    // add form field types to single attribute from editable config
    addFormFieldsBeingEdited({
      elem: editablePopoverElem, 
      config: editableConfig
    });
    
    // render html inside the edit popover
    let remakeEditAreasElem = editablePopoverElem.querySelector(".remake-edit__edit-areas");
    remakeEditAreasElem.innerHTML = generateRemakeEditAreas({config: editableConfig});

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
      textareaElems.forEach(el => autosize$1(el));
    });

    // focus input
    let firstFormInput = editablePopoverElem.querySelector("textarea, input");
    firstFormInput.focus();
  });

  $$1.on("click", ".remake-edit__button:not([type='submit'])", function (event) {
    event.preventDefault();
  });
}

function getEditableInfo (elem) {
  if (elem.hasAttribute("data-i-editable")) {
    return [ "remakeEdit", elem.getAttribute("data-i-editable") ];
  } else if (elem.hasAttribute("data-i-editable-with-remove")) {
    return [ "remakeEditWithRemove", elem.getAttribute("data-i-editable-with-remove") ];
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
    elem.setAttribute("data-o-key-" + camelCaseToDash(obj.name), "");
  });
}

function addFormFieldsBeingEdited ({elem, config}) {
  let attrValue = config.map(obj => obj.modifier).join(" ");
  elem.setAttribute("data-remake-edit-fields", attrValue);
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

function insertRemakeEditPopoverHtml () {
  let htmlString = `
  <div id="remake__auto-generated">
    <form 
      class="remake-edit" 

      data-i-sync
      data-switches="remakeEdit(no-auto) remakeEditWithRemove(no-auto) remakeEditWithHide(no-auto)"

      data-o-type="object"
    >
      <div 
        class="remake-edit__backdrop"
        data-switch-actions="remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)"
      ></div>
      <div class="remake-edit__edit-container">
        <div class="remake-edit__edit-areas">
        </div>
        <div class="remake-edit__buttons">
          <a 
            class="remake-edit__button remake-edit__button--remove" 
            href="#"
            data-i-remove
            data-switch-actions="remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)"
          >remove</a>
          <a 
            class="remake-edit__button remake-edit__button--hide" 
            href="#"
            data-i-hide
            data-switch-actions="remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)"
          >remove</a>
          <a 
            class="remake-edit__button remake-edit__button--cancel" 
            href="#"
            data-switch-actions="remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)"
          >cancel</a>
          <button 
            class="remake-edit__button remake-edit__button--save" 
            type="submit"
            data-switch-actions="remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)"
          >save</button>
        </div>
      </div>
    </form>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", htmlString);
}

function initAddingItemEventListener () {
  $$1.on("click", "[data-i-new]", function (event) {
    let triggerElem = event.currentTarget;
    
    // parse the data attribute to get the selector and the template name
    let [templateName, selector] = getAttributeValueAsArray(triggerElem, "data-i-new");

    // pass the template name into an endpoint and get the resulting html back
    ajaxPost("/new", {templateName}, function (res) {
      let {htmlString} = res;

      // find the closest element matching the selector
      let listElem = findInParents(triggerElem, selector);

      // insert the rendered template into that element
      listElem.insertAdjacentHTML("beforeend", htmlString);

      callSaveFunction({targetElement: listElem});
    });

  });
}

function initInputEventListeners (options) {
  merge(optionsData, options);
  
  enableSaveAttribute(afterSync);
  initInboundDataSyncEventListener();
  initSaveEventListener();
  initRemoveAndHideEventListeners();
  initChoiceAndToggleEventListeners();
  initInputElementEventListener();
  initClickToSaveEventListener();
  initEditableAttribute();
  initAddingItemEventListener();
}

let init = initInputEventListeners;

export { $$1 as $, Switches, callMultipleWatchFunctions, callSaveFunction, copyLayout, getDataAndDataSourceElemFromNodeAndAncestors, getDataFromNode, getDataFromRootNode, getLocationKeyValue, getValueAndDataSourceElemFromKeyName, init, initInputEventListeners, initSaveFunctions, setLocationKeyValue, setValueForKeyName };
