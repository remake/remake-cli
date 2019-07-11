function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

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

var $$1 = function $(selector) {
  return new QueryObj(selector);
};

$$1.on = on;
$$1.off = off;
$$1.fire = fire;
var data = [];

$$1.data = function (elem, key, value) {
  if (!elem || !key) {
    return;
  } // get data:


  if (!value) {
    var match = data.find(function (item) {
      return item.elem === elem && item.key === key;
    });
    return match && match.value;
  } // set data:


  if (value) {
    var existingIndex = data.findIndex(function (item) {
      return item.elem === elem && item.key === key;
    });

    if (existingIndex > -1) {
      data.splice(existingIndex, 1);
    }

    data.push({
      key: key,
      value: value,
      elem: elem
    });
  }
};

$$1.arr = function (arrLike) {
  if (arrLike === null || arrLike === undefined) {
    return [];
  } else {
    return Array.from(arrLike);
  }
};

var QueryObj =
/*#__PURE__*/
function () {
  function QueryObj(selector) {
    _classCallCheck(this, QueryObj);

    var nodeList = document.querySelectorAll(selector);
    var nodeListArr = Array.from(nodeList);

    if (selector.endsWith(":first")) {
      nodeListArr = nodeListArr.slice(0, 1);
    }

    this.arr = nodeListArr;
  }

  _createClass(QueryObj, [{
    key: "get",
    value: function get(index) {
      if (index === undefined) {
        return this.arr;
      }

      try {
        return this.arr[index];
      } catch (err) {
        return undefined;
      }
    }
  }, {
    key: "data",
    value: function data(key, value) {
      for (var i = 0; i < this.arr.length; i++) {
        var elem = this.arr[i];
        $$1.data(elem, key, value);
      }
    }
  }, {
    key: "on",
    value: function on(name, cb) {
      this.arr.forEach(function (el) {
        el.addEventListener(name, cb);
      });
    }
  }]);

  return QueryObj;
}();

window.$ = $$1;

// TRAVERSING & ASSEMBLING DOM UTILS
function forEachAncestorMatch(_ref) {
  var elem = _ref.elem,
      selector = _ref.selector,
      callback = _ref.callback;
  var matchingElem = elem.closest(selector);

  if (matchingElem) {
    callback(matchingElem);
    var matchingElemParent = matchingElem.parentNode;

    if (matchingElemParent) {
      forEachAncestorMatch({
        elem: matchingElemParent,
        selector: selector,
        callback: callback
      });
    }
  }
}

function getParents(_ref2) {
  var elem = _ref2.elem,
      selector = _ref2.selector,
      includeCurrentElement = _ref2.includeCurrentElement;
  var parents = [];

  if (!includeCurrentElement) {
    elem = elem.parentNode;
  }

  for (; elem && elem !== document; elem = elem.parentNode) {
    if (!selector || selector && elem.matches(selector)) {
      parents.push(elem);
    }
  }

  return parents;
} // recursively search inside all parent elements for a selector

function findInParents(elem, selector) {
  var foundElem = elem.parentElement.querySelector(selector);

  if (foundElem || elem.parentElement === document.documentElement) {
    return foundElem;
  } else {
    return findInParents(elem.parentElement, selector);
  }
} // LOOPING OVER ELEMENT ATTRIBUTES

function forEachAttr(elem, fn) {
  var attributes = elem.attributes;
  var attributesLength = attributes.length;

  for (var i = 0; i < attributesLength; i++) {
    var attrName = attributes[i].name;
    var attrValue = attributes[i].value;
    fn(attrName, attrValue);
  }
} // ELEMENT POSITION

function getElementOffset(el) {
  var clientRect = el.getBoundingClientRect();
  var top = clientRect.top + window.pageYOffset;
  var left = clientRect.left + window.pageXOffset;
  var right = clientRect.width + left;
  var bottom = clientRect.height + top;
  var width = right - left;
  var height = bottom - top;
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
function removeSpacesInParentheses(str) {
  var letters = str.split("");
  var newLetters = [];
  var inParentheses = false;

  for (var i = 0; i < letters.length; i++) {
    var currentLetter = letters[i];

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
} // trims string, replaces multiple spaces with single spaces


function formatSpaces(str) {
  return str.trim().replace(/  +/g, " ");
}

function parseAttributeString(attributesString) {
  var formattedString = removeSpacesInParentheses(formatSpaces(attributesString)); // => "switchName(no-auto,parent) switchName2(auto,parent)"

  var separatedParamSections = formattedString.split(" "); // => ["switchName(no-auto,parent)", "switchName2(auto,parent)"]

  var separatedAllParams = separatedParamSections.map(function (str) {
    return str.replace(/\s|\)/g, "").split(/\(|,/);
  }); // => [["switchName", "no-auto", "parent"], ["switchName2", "auto", "parent"]]

  return separatedAllParams;
} // this parses multiple *repeating* parameters, each with possible *sub-parameters*


function makeParseFunction(attributeName, keyNames) {
  return function parseFunction(elem) {
    var attributesString = elem.getAttribute(attributeName); // e.g. "switchName(no-auto, parent) switchName2(auto, parent)"

    if (!attributesString) {
      return [];
    }

    var parsedAttributeValues = parseAttributeString(attributesString); // e.g. [["switchName", "no-auto", "parent"], ["switchName2", "auto", "parent"]]        

    return parsedAttributeValues.map(function (arrayOfValues) {
      var returnObj = {};
      keyNames.forEach(function (keyName, index) {
        var val = arrayOfValues[index];

        if (val) {
          returnObj[keyName] = arrayOfValues[index];
        }
      });
      return returnObj;
    });
  };
}

var parseSwitchAttributes = makeParseFunction("data-switches", ["name", "auto", "customName"]);
var parseSwitchActionAttributes = makeParseFunction("data-switch-actions", ["name", "type", "context"]);
var parseSwitchStopAttributes = makeParseFunction("data-switch-stop", ["name"]);
var parseSwitchedOnAttributes = makeParseFunction("data-switched-on", ["name"]);

function parseStringWithIndefiniteNumberOfParams(attributesString) {
  if (!attributesString) {
    return [];
  }

  var parsedAttributeValues = parseAttributeString(attributesString); // e.g. [["func1", "1", "2"], ["func2"]]        

  return parsedAttributeValues.map(function (arrayOfValues) {
    return {
      funcName: arrayOfValues[0],
      args: arrayOfValues.slice(1)
    };
  });
} // this parses multiple parameters that *don't* repeat and *don't* have sub-parameters


function makeSimpleParseFunction(attributeName, keyNames) {
  return function parseFunction(elem) {
    var attributesString = elem.getAttribute(attributeName);

    if (!attributesString) {
      return {};
    }

    attributesString = formatSpaces(attributesString);
    var parsedAttributeValues = attributesString.split(" "); // e.g. [".btn", "100", "-50", "both", ".btn--small"]

    return parsedAttributeValues.reduce(function (accumulator, currentValue, index) {
      var keyName = keyNames[index];
      accumulator[keyName] = currentValue;
      return accumulator;
    }, {});
  };
}

var parseCopyLayoutAttributes = makeSimpleParseFunction("data-copy-layout", ["selectorForPositionTarget", "xOffset", "yOffset", "dimensionsName", "selectorForDimensionsTarget"]);
var parseCopyPositionAttributes = makeSimpleParseFunction("data-copy-position", ["selectorForPositionTarget", "xOffset", "yOffset"]);
var parseCopyDimensionsAttributes = makeSimpleParseFunction("data-copy-dimensions", ["selectorForDimensionsTarget", "dimensionsName"]);

function getAttributeValueAsArray(elem, attributeName) {
  // get the value of the attribute
  var attributesString = elem.getAttribute(attributeName); // if it's an empty string or doesn't exist, return an empty array

  if (!attributesString) {
    return [];
  } // trim and replace duplicate spaces


  attributesString = formatSpaces(attributesString); // return an array of the "words" in the string

  return attributesString.split(" ");
} // -------------------------------------------------------------------------
//    advanced attribute parsing (supports args that have spaces in them!)
// -------------------------------------------------------------------------


var regexForPhrase = /^[^\(\):,]+$/;
var regexForPhraseOrSpecialCharacter = /([^\(\):,]+|[\(\):,]|)/g;

function getParts(attributeString) {
  return attributeString.match(regexForPhraseOrSpecialCharacter);
}

function assembleResult(parts) {
  var currentObject;
  var extractedObjects = [];
  var isWithinParens = false;
  var hasModifierBeenProcessed = false;
  parts.forEach(function (currentPart, index) {
    var previousPart = parts[index - 1];
    var nextPart = parts[index + 1];

    if (!currentPart) {
      // remove empty strings
      return;
    }

    if (previousPart === "(") {
      isWithinParens = true;
    }

    if (previousPart === ":" || previousPart === "(" && nextPart !== ":" && nextPart !== ")") {
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
      extractedObjects.push(currentObject); // this part is the "name" if it comes right before "("

      currentObject.name = currentPart.trim();
    }

    if (previousPart === "(" && (nextPart === ":" || nextPart === ")")) {
      // this part is the "modifier" if it comes right after "(" and right before ":"
      if (regexForPhrase.test(currentPart)) {
        currentObject.modifier = currentPart.trim();
      }
    }

    if (isWithinParens && hasModifierBeenProcessed && regexForPhrase.test(currentPart)) {
      currentObject.args = currentObject.args || []; // it's one of the `args` if the modifier doesn't exist or has been processed and it's not a comma and it's before a ")"

      currentObject.args.push(currentPart.trim());
    }
  });
  return extractedObjects;
}

function processAttributeString(attributeString) {
  var parts = getParts(attributeString);
  var extractedObjects = assembleResult(parts);
  return extractedObjects;
}

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

var lookupParser = [{
  selector: "[data-copy-layout]",
  parser: parseCopyLayoutAttributes,
  name: "both"
}, {
  selector: "[data-copy-position]",
  parser: parseCopyPositionAttributes,
  name: "position"
}, {
  selector: "[data-copy-dimensions]",
  parser: parseCopyDimensionsAttributes,
  name: "dimensions"
}]; // Full specification for element with [data-copy-layout] attribute:
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

$$1.on("click", "[data-copy-layout], [data-copy-position], [data-copy-dimensions]", function (event) {
  var sourceElement = event.currentTarget; // parse position/dimensions attributes of source element as a list

  var listOfElementLayoutData = getListOfElementLayoutData(sourceElement); // loop through list of layout data 

  listOfElementLayoutData.forEach(function (_ref) {
    var selectorForPositionTarget = _ref.selectorForPositionTarget,
        xOffset = _ref.xOffset,
        yOffset = _ref.yOffset,
        dimensionsName = _ref.dimensionsName,
        selectorForDimensionsTarget = _ref.selectorForDimensionsTarget,
        copyMethod = _ref.copyMethod;
    // get offset data for the source element, so we can use it in both functions, i.e. copyDimensions AND copyPosition
    var sourceElementOffsetData = getElementOffset(sourceElement); // check if we're copying dimensions

    if (copyMethod === "dimensions" || copyMethod === "both") {
      // if we don't have a dimensions target, set the target to the position's target (because that's the default)
      if (!selectorForDimensionsTarget) {
        selectorForDimensionsTarget = selectorForPositionTarget;
      } // copy the dimensions from the source element onto the dimension's target


      copyDimensions(sourceElementOffsetData, selectorForDimensionsTarget, dimensionsName);
    } // check if we're copying position


    if (copyMethod === "position" || copyMethod === "both") {
      // copy the position from the source element onto the position target
      copyPosition(sourceElementOffsetData, selectorForPositionTarget, xOffset, yOffset);
    }
  });
});

function getListOfElementLayoutData(sourceElement) {
  var parsedData = [];
  lookupParser.forEach(function (parser) {
    // figure out the parser to use
    if (sourceElement.matches(parser.selector)) {
      // parse the attributes on the element
      var elemData = parser.parser(sourceElement); // e.g. {"selectorForPositionTarget", "xOffset", "yOffset", "dimensionsName", "selectorForDimensionsElTarget
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
  }); // return an array with all the parsed attributes

  return parsedData; // e.g. [{copyMethod, selectorForPositionTarget, xOffset, yOffset, dimensionsName, selectorForDimensionsElTarget
}

function copyDimensions(sourceElementOffsetData, selectorForDimensionsTarget, dimensionsName) {
  // get the new width and height data we want to set
  var width = sourceElementOffsetData.width,
      height = sourceElementOffsetData.height; // loop through the target elements

  $$1(selectorForDimensionsTarget).arr.forEach(function (targetElem) {
    // if copying the width, set a new width
    if (dimensionsName === "width" || dimensionsName === "both") {
      targetElem.style.width = width + "px";
    } // if copying the height, set a new height


    if (dimensionsName === "height" || dimensionsName === "both") {
      targetElem.style.height = height + "px";
    }
  });
}

function copyPosition(sourceElementOffsetData, selectorForPositionTarget) {
  var xOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var yOffset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  // get the new position data we want to set
  var left = sourceElementOffsetData.left,
      top = sourceElementOffsetData.top;
  left += xOffset;
  top += yOffset; // loop through the target elements 

  $$1(selectorForPositionTarget).arr.forEach(function (targetElem) {
    // set a new top position
    targetElem.style.top = top + "px"; // set a new left position

    targetElem.style.left = left + "px";
  });
} // for external use. the other methods would need to be adapted before they're exported


function copyLayout() {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      sourceElem = _ref2.sourceElem,
      targetElem = _ref2.targetElem,
      _ref2$dimensionsName = _ref2.dimensionsName,
      dimensionsName = _ref2$dimensionsName === void 0 ? "width" : _ref2$dimensionsName,
      _ref2$xOffset = _ref2.xOffset,
      xOffset = _ref2$xOffset === void 0 ? 0 : _ref2$xOffset,
      _ref2$yOffset = _ref2.yOffset,
      yOffset = _ref2$yOffset === void 0 ? 0 : _ref2$yOffset;

  var sourceElemOffsetData = getElementOffset(sourceElem); // copy position

  var left = sourceElemOffsetData.left,
      top = sourceElemOffsetData.top;
  left += xOffset;
  top += yOffset;
  targetElem.style.top = top + "px";
  targetElem.style.left = left + "px"; // copy dimensions

  var width = sourceElemOffsetData.width,
      height = sourceElemOffsetData.height;

  if (dimensionsName === "width" || dimensionsName === "both") {
    targetElem.style.width = width + "px";
  }

  if (dimensionsName === "height" || dimensionsName === "both") {
    targetElem.style.height = height + "px";
  }
}

function isStringANumber(str) {
  return /^\d+$/.test(str);
} // won't work with consecutive hyphens

function dashToCamelCase(str) {
  return str.replace(/-([a-z])/g, function (match) {
    return match[1].toUpperCase();
  });
} // won't work with two consecutive uppercase letters e.g. "thisIsABundle"

function camelCaseToDash(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Turn on, off, or toggle multiple switches by clicking an action trigger element
document.addEventListener("click", function (event) {
  var triggeredSwitches = []; // 1. find all the action triggers that are ancestors of the clicked element (includes `stop` elements)

  var actionElements = getActionElemsFromTargetAndParents(event.target); // 2. parse each action trigger (get the name of the switch, the action, and the context)

  var unfilteredActions = getActionsData(actionElements); // 3. remove all actions that have been stopped

  var _processActions = processActions(unfilteredActions),
      actionsToTrigger = _processActions.actionsToTrigger,
      stopActions = _processActions.stopActions; // 4. for each triggered switch


  actionsToTrigger.forEach(function (actionToTrigger) {
    // e.g. {name, type, context, elem}
    // a. find the switch, using context if present
    var targetSwitchElements = getTargetSwitchElements(actionToTrigger); // b. get the switch data from the target elements using the switch name

    var targetSwitches = getSwitchesByNameFromElements(actionToTrigger.name, targetSwitchElements); // c. turn switch on or off, applying custom switch name if present

    targetSwitches.forEach(function (targetSwitch) {
      // e.g. {name, elem, customName, auto}
      if (actionToTrigger.type === "toggle") {
        toggle(targetSwitch, actionToTrigger);
      } else if (actionToTrigger.type === "on") {
        turnOn(targetSwitch, actionToTrigger);
      } else if (actionToTrigger.type === "off") {
        turnOff(targetSwitch, actionToTrigger);
      }
    }); // c. keep track of all switches and their elements that were affected by this click

    triggeredSwitches = triggeredSwitches.concat(targetSwitches);
  }); // 5. auto deactivate activated switches (if they should be)

  automaticallyTurnOffOtherSwitches(triggeredSwitches, stopActions);
});

function getActionElemsFromTargetAndParents(elem) {
  var selector = "[data-switch-actions], [data-switch-stop]";
  var actionElements = getParents({
    elem: elem,
    selector: selector,
    includeCurrentElement: true
  });
  return actionElements;
}

function getActionsData(actionElements) {
  return actionElements.reduce(function (accumulator, actionElement) {
    var actionsList = [];

    if (actionElement.matches("[data-switch-actions]")) {
      actionsList = actionsList.concat(parseSwitchActionAttributes(actionElement)); // e.g. [{name: "switchName", type: "toggle", context: "ancestors"}]
    }

    if (actionElement.matches("[data-switch-stop]")) {
      actionsList = actionsList.concat(parseSwitchStopAttributes(actionElement)); // e.g. [{name: "switchName"}]
    }

    actionsList.forEach(function (action) {
      return action.elem = actionElement;
    });
    return accumulator.concat(actionsList);
  }, []);
} // remove all actions targeting the same switch name as another action before them
// Example:
// [1(toggle), 2(stop), 2(on), 5(on), 6(on), 6(stop), 8(off), 1(on)]
// 1 toggles, 2 does nothing, 5 turns on, 6 turns on, 8 turns off, and the last 1 doesn't fire


function processActions(unfilteredActions) {
  // e.g. [{name: "switchName", type: "toggle", context: "ancestors", elem: elem}]
  var processedActions = [];
  var actionsToTrigger = [];
  var stopActions = []; // 1. loop through all unfiltered actions

  unfilteredActions.forEach(function (unfilteredAction) {
    var isAlreadyProcessed = processedActions.some(function (processedAction) {
      return processedAction.name === unfilteredAction.name;
    }); // 2. check if action has already occurred earlier

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
  return {
    actionsToTrigger: actionsToTrigger,
    stopActions: stopActions
  };
}

function getTargetSwitchElements(action) {
  // action: e.g. {name, type, context}
  // type is either "toggle" or "on" or "off"
  // context can either be "ancestors" or a number starting at 0
  var name = action.name,
      context = action.context,
      elem = action.elem;
  var selector = "[data-switches~='".concat(name, "'], [data-switches*='").concat(name, "(']"); // matches a space separated name, as well as a name followed by an open parentheses anywhere in the attribute

  var switchElements;

  if (context) {
    if (context === "ancestors") {
      switchElements = getParents({
        elem: elem,
        selector: selector,
        includeCurrentElement: true
      });
    } else if (isStringANumber(context)) {
      var positionNumber = parseInt(context, 10);
      var allSwitchElements = $$1(selector).arr;
      switchElements = allSwitchElements.splice(positionNumber, 1); // splice will return elem at `positionNumber` index and wrap it an array
    }
  } else {
    switchElements = $$1(selector).arr;
  }

  return switchElements;
}

function getSwitchesByNameFromElements(switchName, switchElements) {
  // switchElements is elems with attr: e.g. data-switches="switchName(auto, customName)"
  // 1. loop through the switch elements
  var switches = switchElements.map(function (switchElement) {
    // 2. get all the switch data
    var switchesList = parseSwitchAttributes(switchElement); // [{"name", "auto", "customName"}]
    // 3. filter through the switch data until you find the current switch name

    var switchData = switchesList.find(function (switchObj) {
      return switchObj.name === switchName;
    }); // 4. add the element to the switch data

    switchData.elem = switchElement;
    return switchData;
  });
  return switches; // e.g. [{name, auto, customName, elem}]
}

function isOn(switchName, elem) {
  return elem.matches("[data-switched-on~=".concat(switchName, "]"));
}

function getTurnedOnSwitchNamesFromElem(elem) {
  var switches = parseSwitchedOnAttributes(elem); // [{name}]

  var switchNames = switches.map(function (switchObj) {
    return switchObj.name;
  }); // ["switchName"]

  return switchNames;
}

function turnOn(switchObj, actionObj) {
  // e.g. {name, elem, customName, auto}
  var isSwitchOn = isOn(switchObj.name, switchObj.elem);

  if (!isSwitchOn) {
    // 1. get turned on switch names
    var switchNames = getTurnedOnSwitchNamesFromElem(switchObj.elem); // ["switchName"]
    // 2. add the new switch name and the (optional) custom name 

    switchNames.push(switchObj.name);

    if (switchObj.customName) {
      switchNames.push(switchObj.customName);
    } // 3. replace old attribute values with new ones (including the old ones too)


    switchObj.elem.setAttribute("data-switched-on", switchNames.join(" "));
  }

  actionObj = Object.assign({}, actionObj, {
    type: "on"
  });
  switchObj.on = isSwitchOn;
  triggerCallbacks(switchObj, actionObj);
}

function turnOff(switchObj, actionObj) {
  // e.g. {name, elem, customName, auto}
  var isSwitchOn = isOn(switchObj.name, switchObj.elem);

  if (isSwitchOn) {
    // 1. get turned on switch names
    var switchNames = getTurnedOnSwitchNamesFromElem(switchObj.elem); // ["switchName"]
    // 2. remove the passed in switch name and the (optional) custom name 

    var filteredSwitchNames = switchNames.filter(function (name) {
      var nameMatches = name === switchObj.name;
      var customNameMatches = name === switchObj.customName;

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

  actionObj = Object.assign({}, actionObj, {
    type: "off"
  });
  switchObj.on = isSwitchOn;
  triggerCallbacks(switchObj, actionObj);
}

function toggle(switchObj, actionObj) {
  var isSwitchOn = isOn(switchObj.name, switchObj.elem);

  if (isSwitchOn) {
    turnOff(switchObj, actionObj);
  } else {
    turnOn(switchObj, actionObj);
  }

  switchObj.on = isSwitchOn;
  triggerCallbacks(switchObj, actionObj);
}

function automaticallyTurnOffOtherSwitches(triggeredSwitches, stopActions) {
  // [{name, elem, customName, auto}]
  // 1. get all the turned on switch elements
  var turnedOnSwitchElements = $$1("[data-switched-on]").arr; // 2. for each switch element:

  turnedOnSwitchElements.forEach(function (switchElem) {
    // a. get the turned on switch names, e.g. ["switchName", "switchName2"]
    var turnedOnSwitchNames = getTurnedOnSwitchNamesFromElem(switchElem); // b. get all the switch data from the element, e.g. [{name, customName, auto}]

    var allSwitchesFromTurnedOnElement = parseSwitchAttributes(switchElem);
    var switchesToTurnOff = allSwitchesFromTurnedOnElement.filter(function (switchObj) {
      // {name, customName, auto}
      // c. filter this array so it only includes the turned on switches
      if (!turnedOnSwitchNames.includes(switchObj.name)) {
        return false;
      } // d. filter out switches that have the "auto" property set to "no-auto"


      if (switchObj.auto === "no-auto") {
        return false;
      } // e. filter out switches whose actions were stopped


      var switchHasBeenStopped = stopActions.find(function (stopAction) {
        return stopAction.name === switchObj.name;
      });

      if (switchHasBeenStopped) {
        return false;
      } // f. filter out switches that were already activated (by matching their name AND element)


      var switchHasBeenProcessed = triggeredSwitches.find(function (processedSwitch) {
        return processedSwitch.name === switchObj.name && processedSwitch.elem === switchElem;
      });

      if (switchHasBeenProcessed) {
        return false;
      }

      return true;
    }); // f. turn off every switch in this final list

    switchesToTurnOff.forEach(function (switchObj) {
      switchObj.elem = switchElem;
      turnOff(switchObj);
    });
  });
}

var callbackList = []; // e.g. [{switchName, switchAction, switchElem, callback}]
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

function when(switchObj) {
  callbackList.push(switchObj);
}

function triggerCallbacks(switchObj, actionObj) {
  // matching on: switchObj.name, actionObj.type, switchObj.elem
  // switchObj: {name, auto, customName, elem}
  // actionObj: {name, type, context, elem}
  var objToMatchAgainst = {
    switchName: switchObj.name,
    switchAction: actionObj.type,
    switchElem: switchObj.elem
  };
  callbackList.forEach(function (callbackData) {
    var isMatching = Object.keys(callbackData).every(function (keyName) {
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
  isOn: isOn,
  turnOn: turnOn,
  turnOff: turnOff,
  toggle: toggle,
  when: when
};

function parseNode(elem, isParentDataAnObject) {
  var elemType = elem.getAttribute("data-o-type"); // elemType can be `object` or `list`

  return {
    elemType: elemType,
    key: isParentDataAnObject ? elem.getAttribute("data-o-key") : null,
    value: elemType === "list" ? [] : getDataFromNode(elem)
  };
} // Converts:
// <div data-o-key-example1="1" data-o-key-example2="2"></div>
// Into:
// {example1: "1", example2: "2"}


function getDataFromNode(elem) {
  var keyPrefix = "data-o-key-";
  var locationKeyPrefix = "data-l-key-";
  var keyPrefixLength = keyPrefix.length;
  var returnObj = {};
  forEachAttr(elem, function (attrName, attrValue) {
    if (attrName.indexOf(keyPrefix) === 0) {
      var keyName = attrName.substring(keyPrefixLength);
      var camelCaseKeyName = dashToCamelCase(keyName);
      returnObj[camelCaseKeyName] = attrValue;
    } else if (attrName.indexOf(locationKeyPrefix) === 0) {
      var _keyName = attrName.substring(keyPrefixLength);

      var _camelCaseKeyName = dashToCamelCase(_keyName);

      attrValue = getLocationKeyValue(elem, _keyName, attrValue);
      returnObj[_camelCaseKeyName] = attrValue;
    }
  });
  return returnObj;
} // 1. Find the CLOSEST `[data-o-type="object"]`
// 2. Get this element's data keys and their values
// 3. Add these key/values into an object (lower/earlier keys always overwrite higher ones)
// 4. Start again at (a) until it returns null and you have a full object


function getDataAndDataSourceElemFromNodeAndAncestors(elem) {
  var collectedData = {};
  var selector = '[data-o-type="object"]';
  forEachAncestorMatch({
    elem: elem,
    selector: selector,
    callback: function callback(matchingElem) {
      var nodeData = getDataFromNode(matchingElem); // add source element

      Object.keys(nodeData).forEach(function (camelCaseKeyName) {
        var value = nodeData[camelCaseKeyName];
        nodeData[camelCaseKeyName] = {
          value: value,
          dataSourceElem: matchingElem
        };
      }); // earlier data, i.e. collectedData, always overwrites new data
      // this is because keys closer to the search source are more likely to belong to it

      collectedData = Object.assign(nodeData, collectedData);
    }
  });
  return collectedData; // e.g. {exampleTitle: {value: "Hello There!", dataSourceElem}}
} // helper function, has repeated code from getLocationKeyValue() and setLocationKeyValue()


function getDataFromLocationString(elem, dashCaseKeyName, locationString) {
  locationString = formatSpaces(locationString);

  var _locationString$split = locationString.split(" "),
      _locationString$split2 = _slicedToArray(_locationString$split, 2),
      selector = _locationString$split2[0],
      elemAttribute = _locationString$split2[1]; // e.g. [".selector", "attr:data-x-text"]


  var targetElem;

  if (!selector || selector === "." || elem.matches(selector)) {
    targetElem = elem;
  } else if (selector === "target") {
    var defaultTargetSelector = "[data-l-target-".concat(dashCaseKeyName, "]");

    if (elem.matches(defaultTargetSelector)) {
      targetElem = elem;
    } else {
      targetElem = elem.querySelector(defaultTargetSelector); // e.g. dashCaseKeyName = "page-title"
    }
  } else {
    targetElem = elem.querySelector(selector);
  }

  return {
    elemAttribute: elemAttribute,
    targetElem: targetElem
  };
}

function getLocationKeyValue(elem, dashCaseKeyName, locationString) {
  var _getDataFromLocationS = getDataFromLocationString(elem, dashCaseKeyName, locationString),
      elemAttribute = _getDataFromLocationS.elemAttribute,
      targetElem = _getDataFromLocationS.targetElem;

  elemAttribute = elemAttribute || "innerText"; // default to innerText

  var elemValue;

  if (elemAttribute.indexOf("attr:") === 0) {
    elemAttribute = elemAttribute.substring(5);
    elemValue = targetElem && targetElem.getAttribute(elemAttribute);
  } else {
    elemValue = targetElem && targetElem[elemAttribute]; // e.g. elem["innerText"]
  }

  return typeof elemValue === "string" ? elemValue.trim() : "";
} // use like this: setLocationKeyValue(elem, ".selector", "example text")
// ^ this will default to setting innerText if there's no 2nd argument


function setLocationKeyValue(elem, dashCaseKeyName, locationString, value) {
  var _getDataFromLocationS2 = getDataFromLocationString(elem, dashCaseKeyName, locationString),
      elemAttribute = _getDataFromLocationS2.elemAttribute,
      targetElem = _getDataFromLocationS2.targetElem;

  elemAttribute = elemAttribute || "innerText"; // default to innerText

  if (targetElem) {
    var valueTrimmed = value.toString().trim();

    if (elemAttribute.indexOf("attr:") === 0) {
      elemAttribute = elemAttribute.substring(5);
      targetElem.setAttribute(elemAttribute, valueTrimmed);
    } else {
      targetElem[elemAttribute] = valueTrimmed;
    }
  }
} // utility function for setting a value on a data attribute
// using a key name that could be EITHER a location key or an output key


function setValueForKeyName(elem, keyName, value) {
  // convert the key name to output and location format
  var dashCaseKeyName = camelCaseToDash(keyName);
  var outputAttr = "data-o-key-" + dashCaseKeyName;
  var locationAttr = "data-l-key-" + dashCaseKeyName; // if the output format is found, set the value of that attribute

  if (elem.hasAttribute(outputAttr)) {
    elem.setAttribute(outputAttr, value);
  } // if the location format is found, set the value using `setLocationKeyValue`


  if (elem.hasAttribute(locationAttr)) {
    var locationString = elem.getAttribute(locationAttr);
    setLocationKeyValue(elem, dashCaseKeyName, locationString, value);
  }
}

function createDataObjectFromElement(elem) {
  var nodeData = parseNode(elem, false);
  return nodeData.value;
}

function addDataFromElementToDataObject(elem, parentData) {
  var isParentDataAnObject = !Array.isArray(parentData);
  var nodeData = parseNode(elem, isParentDataAnObject);

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

// * data-o-type (attribute value can be "object" or "list")
// * data-o-key (attribute value can be any string, but ideally camel cased with no spaces)
// * data-o-value (attribute value can be any string)

function getDataFromRootNode(rootNode) {
  var rootData;

  function getDataFromDom(currentElement, parentData) {
    // can this element's data be parsed?
    var canElementDataBeParsed = currentElement.hasAttribute("data-o-type"); // if element's data can be parsed, add its data to the current tree of data
    // otherwise, skip it

    if (canElementDataBeParsed) {
      // if there's parent data, add the element's data to it
      // and re-assign parentData to this new iteration's data
      if (parentData) {
        parentData = addDataFromElementToDataObject(currentElement, parentData);
      } // if there's no parent data, create new parent data


      if (!parentData && !rootData) {
        // create new parent data
        parentData = createDataObjectFromElement(currentElement); // it will also be the original data, since this is the first time through

        rootData = parentData;
      } else if (!parentData && rootData) {
        // special orphaned data case:
        //   instead of letting orphan data (i.e. two or more objects that don't share 
        //   a single parent) overwrite the root data, merge it in with the current root data
        parentData = addDataFromElementToDataObject(currentElement, rootData);
      }
    } // pass all the collected data to the next iteration


    var children = currentElement.children;

    for (var i = 0; i < children.length; i++) {
      getDataFromDom(children[i], parentData);
    } // after all the iterations, the original data should have all the parsed data from the DOM


    return rootData;
  }

  return getDataFromDom(rootNode);
}

var optionsData = {
  // default watch functions
  watchFunctions: {
    "*": function _(_ref) {
      var watchElem = _ref.watchElem,
          watchAttrName = _ref.watchAttrName,
          camelCaseKeyName = _ref.camelCaseKeyName,
          value = _ref.value,
          dataSourceElem = _ref.dataSourceElem,
          watchFuncName = _ref.watchFuncName,
          watchFuncArgs = _ref.watchFuncArgs,
          dataTargetElem = _ref.dataTargetElem;
      // if func is a valid elem property, set that prop to the new value (allow nested props)
      var listOfProps = watchFuncName.split(".");
      var currentObj = watchElem;
      listOfProps.forEach(function (propName, index) {
        if (index + 1 < listOfProps.length) {
          currentObj = currentObj[propName];
        } else {
          currentObj[propName] = value;
        }
      }); // if (elemProps.includes(watchFuncName)) {
      //   watchElem[watchFuncName] = value;
      // }
      // if func is a data attribute, set the first arg as its value

      if (watchFuncName.startsWith("data-")) {
        watchElem.setAttribute(watchFuncName, value);
      }
    }
  }
};

// - watch functions are named inside watch attributes and defined inside app code. they run 
//   usually when the page loads, but not always. they ALWAYS run when data is synced to a data
//   key that matches their own key 
//     (e.g. a sync to `data-o-key-name` will trigger => `data-w-key-name`)
// TIPS
// - if you want a watch function to run every time data in synced, but not on page load, give
//   it a watch attribute, but not a `data-w` attribute.
// WARNING
// - watch attrs must be inside or on their data elements. they can't watch data inside themselves

function getValueAndDataSourceElemFromKeyName(elem, dashCaseKeyName) {
  // 1. construct the attribute names
  var outputDataAttributeName = "data-o-key-" + dashCaseKeyName; // e.g. "data-o-key-book-title"

  var locationDataAttributeName = "data-l-key-" + dashCaseKeyName; // e.g. "data-l-key-book-title"
  // 2. get the closest element with a matching data attribute (location or output)

  var selector = "[".concat(outputDataAttributeName, "], [").concat(locationDataAttributeName, "]");
  var dataSourceElem = elem.closest(selector); // 3. get the value from the matching attribute

  var hasOutputDataAttribute = dataSourceElem.hasAttribute(outputDataAttributeName);

  if (hasOutputDataAttribute) {
    return {
      dataSourceElem: dataSourceElem,
      value: dataSourceElem.getAttribute(outputDataAttributeName)
    };
  } else {
    var locationString = dataSourceElem.getAttribute(locationDataAttributeName);
    return {
      dataSourceElem: dataSourceElem,
      value: getLocationKeyValue(dataSourceElem, dashCaseKeyName, locationString)
    };
  }
} // callWatchFunctionsOnElem
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

function callWatchFunctionsOnElem(_ref) {
  var watchElem = _ref.watchElem,
      watchAttrName = _ref.watchAttrName,
      value = _ref.value,
      dataSourceElem = _ref.dataSourceElem,
      dataTargetElem = _ref.dataTargetElem;
  // get camel case key name
  var camelCaseKeyName = dashToCamelCase(watchAttrName.substring("data-w-key-".length)); // get the string to be parsed

  var watchAttributeString = watchElem.getAttribute(watchAttrName); // parses the watch attribute into a series of function/argument pairs
  //   e.g. [{funcName: "func1", args: ["1", "2"]}, {funcName: "func2", args: []}]

  var listOfFunctionsWithTheirArguments = parseStringWithIndefiniteNumberOfParams(watchAttributeString); // call each watch function

  listOfFunctionsWithTheirArguments.forEach(function (_ref2) {
    var funcName = _ref2.funcName,
        args = _ref2.args;
    var watchFunc = optionsData.watchFunctions && (optionsData.watchFunctions[funcName] || optionsData.watchFunctions["*"]);
    watchFunc({
      watchElem: watchElem,
      watchAttrName: watchAttrName,
      camelCaseKeyName: camelCaseKeyName,
      value: value,
      dataSourceElem: dataSourceElem,
      watchFuncName: funcName,
      watchFuncArgs: args,
      dataTargetElem: dataTargetElem
    });
  });
} // # What does it do?
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

function callMultipleWatchFunctions(watchElems) {
  // get the watch key prefix
  var keyPrefix = "data-w-key-";
  var keyPrefixLength = keyPrefix.length; // loop through each watch elem

  watchElems.forEach(function (watchElem) {
    // loop through each attribute of the watch elem
    forEachAttr(watchElem, function (attrName, attrValue) {
      // test to see if the attribute is a watch attribute
      if (attrName.indexOf(keyPrefix) === 0) {
        // get dash case key name from watch attribute
        var dashCaseKeyName = attrName.substring(keyPrefixLength); // e.g. book-title
        // get the value to set from closest data source

        var _getValueAndDataSourc = getValueAndDataSourceElemFromKeyName(watchElem, dashCaseKeyName),
            value = _getValueAndDataSourc.value,
            dataSourceElem = _getValueAndDataSourc.dataSourceElem; // call the watch function for this attribute, using the value from the closest data source


        callWatchFunctionsOnElem({
          watchElem: watchElem,
          watchAttrName: attrName,
          value: value,
          dataSourceElem: dataSourceElem,
          dataTargetElem: dataSourceElem
        });
      }
    });
  });
}
function getWatchElements(_ref3) {
  var elementWithData = _ref3.elementWithData,
      dashCaseKeyName = _ref3.dashCaseKeyName;
  var watchSelector = "[data-w-key-".concat(dashCaseKeyName, "]");
  var nestedWatchSelector = ":scope [data-o-key-".concat(dashCaseKeyName, "] [data-w-key-").concat(dashCaseKeyName, "]");
  var watchElements = [];

  if (elementWithData.matches(watchSelector)) {
    watchElements.push(elementWithData);
  }

  var allWatchElements = Array.from(elementWithData.querySelectorAll(watchSelector));
  var nestedWatchElements = Array.from(elementWithData.querySelectorAll(nestedWatchSelector));
  return watchElements.concat(allWatchElements.filter(function (el) {
    return !nestedWatchElements.includes(el);
  }));
}

var afterSyncCallbacks = [];
function afterSync(cb) {
  afterSyncCallbacks.push(cb);
}
function syncDataBetweenElements(_ref) {
  var sourceElement = _ref.sourceElement,
      targetElement = _ref.targetElement,
      shouldTriggerSave = _ref.shouldTriggerSave;
  var elementsDataWasSyncedInto = []; // 1. Assemble an object from the source element and its ancestors (L or O)
  // Why look in ancestors for data? because you want to be able to click an edit button anywhere on the page in order to edit the global/root data

  var fullDataObject = getDataAndDataSourceElemFromNodeAndAncestors(sourceElement); // 2. Loop through the keys of the assembled object

  Object.keys(fullDataObject).forEach(function (camelCaseKeyName) {
    // e.g. bundleName
    var originalValue = fullDataObject[camelCaseKeyName].value;
    var dataSourceElem = fullDataObject[camelCaseKeyName].dataSourceElem;
    var dashCaseKeyName = camelCaseToDash(camelCaseKeyName); // a. Sync location & output keys:

    var _syncToLocationOrOutp = syncToLocationOrOutputKey({
      targetElement: targetElement,
      camelCaseKeyName: camelCaseKeyName,
      dashCaseKeyName: dashCaseKeyName,
      originalValue: originalValue,
      dataSourceElem: dataSourceElem
    }),
        actualValue = _syncToLocationOrOutp.actualValue,
        closestMatchingElem = _syncToLocationOrOutp.closestMatchingElem; // b. Sync input keys:


    syncToInputKeys({
      targetElement: targetElement,
      camelCaseKeyName: camelCaseKeyName,
      actualValue: actualValue
    }); // c. Store the closestMatchingElem for later

    if (closestMatchingElem && elementsDataWasSyncedInto.indexOf(closestMatchingElem) === -1) {
      elementsDataWasSyncedInto.push(closestMatchingElem);
    }
  }); // 3. Call after sync callbacks

  callAfterSyncCallbacks({
    elementsDataWasSyncedInto: elementsDataWasSyncedInto,
    sourceElement: sourceElement,
    targetElement: targetElement,
    shouldTriggerSave: shouldTriggerSave,
    data: fullDataObject
  });
} // used by saveEventListener.js
// IMPORTANT: expects an event, not an element

function triggerSyncAndSave(event) {
  event.preventDefault(); // 2. find the nearest ancestor element that has the attribute `data-i-sync`

  var syncElement = event.currentTarget.closest("[data-i-sync]"); // make sure data sync happens after all date is in place 
  //   e.g. we might want to have the switch action button also set data 
  //        (we currently do this with the inline edit revisions submit button)

  setTimeout(function () {
    // 3. copy data from the data sync element (and its children) back to the source element
    syncDataBetweenElements({
      sourceElement: syncElement,
      targetElement: $.data(syncElement, "source"),
      shouldTriggerSave: true
    });
  });
} // dataSourceElement: this is the element where the data is coming from

function syncToLocationOrOutputKey(_ref2) {
  var targetElement = _ref2.targetElement,
      camelCaseKeyName = _ref2.camelCaseKeyName,
      dashCaseKeyName = _ref2.dashCaseKeyName,
      originalValue = _ref2.originalValue,
      dataSourceElem = _ref2.dataSourceElem;
  var actualValue; // 1. Find _ONE_ CLOSEST matching key on the target element (L or O)

  var dataAttrSelector = "[data-l-key-".concat(dashCaseKeyName, "],[data-o-key-").concat(dashCaseKeyName, "]");
  var closestMatchingElem = targetElement.closest(dataAttrSelector); // 2. If it exists, replace its value with the value from the assembled object

  if (closestMatchingElem) {
    // the default value is intended to overwrite the value immediately before it's synced into instead of when the data is originally parsed
    // -- note: it's nice having the default attr on the main data source element and it makes parsing nodes more performant
    actualValue = getValueOrDefaultValue(closestMatchingElem, originalValue, dashCaseKeyName);
    setValueForKeyName(closestMatchingElem, camelCaseKeyName, actualValue); // 3. Call watch functions
    // IMPORTANT: We use the element that each key is synced into as the element to search for matching watch attributes

    callWatchFunctions({
      dashCaseKeyName: dashCaseKeyName,
      parentOfTargetElements: closestMatchingElem,
      value: actualValue,
      dataSourceElem: dataSourceElem
    });
  }

  return {
    actualValue: actualValue,
    closestMatchingElem: closestMatchingElem
  };
}

function syncToInputKeys(_ref3) {
  var targetElement = _ref3.targetElement,
      camelCaseKeyName = _ref3.camelCaseKeyName,
      actualValue = _ref3.actualValue;
  // 1. Find _ONE_ CHILD elements of the target element that match a `data-i`
  // options: radio, select, checkbox, input, textarea, div
  // how to find: radio.name, select.name, checkbox.name, input.name, div.customAttr
  var matchingKeyElem = targetElement.querySelector("[data-i][name='".concat(camelCaseKeyName, "'], [data-i][data-i-key='").concat(camelCaseKeyName, "']")); // do nothing if not found

  if (!matchingKeyElem) {
    return;
  } // 2. What type of element is it?
  // options: radio, select, checkbox, input, textarea, div
  // how to tell: elem.nodeName for select, textarea, div (this will be fallback default); attr type for radio, checkbox, input (this will be the fallback default)


  var nodeName = matchingKeyElem.nodeName.toLowerCase(); // select, textarea, div, input, other

  if (nodeName === "input") {
    var inputType = matchingKeyElem.getAttribute("type"); // radio, checkbox, text, other

    if (inputType === "radio") {
      var matchingValueElem = targetElement.querySelector("[type='radio'][name='".concat(camelCaseKeyName, "'][value='").concat(actualValue, "']"));

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

function callWatchFunctions(_ref4) {
  var dashCaseKeyName = _ref4.dashCaseKeyName,
      parentOfTargetElements = _ref4.parentOfTargetElements,
      value = _ref4.value,
      dataSourceElem = _ref4.dataSourceElem;
  // 1. Find ALL CHILD elements of the target element that match a `data-w-key` UNLESS they're children of another matching data-o-key element
  var watchElems = getWatchElements({
    elementWithData: parentOfTargetElements,
    dashCaseKeyName: dashCaseKeyName
  });
  watchElems.forEach(function (watchElem) {
    // 2. Call all the watch functions defined by this attribute
    callWatchFunctionsOnElem({
      watchElem: watchElem,
      watchAttrName: "data-w-key-".concat(dashCaseKeyName),
      value: value,
      dataSourceElem: dataSourceElem,
      dataTargetElem: parentOfTargetElements
    });
  });
}

function callAfterSyncCallbacks(_ref5) {
  var elementsDataWasSyncedInto = _ref5.elementsDataWasSyncedInto,
      sourceElement = _ref5.sourceElement,
      targetElement = _ref5.targetElement,
      shouldTriggerSave = _ref5.shouldTriggerSave,
      data = _ref5.data;

  if (afterSyncCallbacks.length > 0) {
    afterSyncCallbacks.forEach(function (afterSyncCallback) {
      afterSyncCallback({
        elementsDataWasSyncedInto: elementsDataWasSyncedInto,
        sourceElement: sourceElement,
        targetElement: targetElement,
        shouldTriggerSave: shouldTriggerSave,
        data: data
      });
    });
  }
} // helpers 


function isValueEmpty(value) {
  return !value || /^\s*$/.test(value);
}

function getDefaultValue(elem, dashCaseKeyName) {
  return elem.getAttribute("data-o-default-" + dashCaseKeyName) || "";
}

function getValueOrDefaultValue(elem, value, dashCaseKeyName) {
  return isValueEmpty(value) ? getDefaultValue(elem, dashCaseKeyName) : value;
}

function initInboundDataSyncEventListener () {
  // 1. watch for when a switch is switched on
  Switches.when({
    switchAction: "on",
    callback: function callback(switchObj, actionObj) {
      // make sure data sync happens after all the data is in place. 
      //   e.g. we might want to have the switch action button also set data
      setTimeout(function () {
        // 2. check its data attributes to see if the switched on element is a data sync elem
        if (switchObj.elem.hasAttribute("data-i-sync")) {
          // 3. copy the data from the action element and its children to this sync elem and its children
          syncDataBetweenElements({
            sourceElement: actionObj.elem,
            targetElement: switchObj.elem
          }); // 4. attach the action element to the switched on element as the `sourceElement`

          $$1.data(switchObj.elem, "source", actionObj.elem);
        }
      });
    }
  });
}

function initSaveEventListener() {
  // 1. watch for when a form with `data-i-sync` on it is submitted, either by pressing a `data-i-save` button or maybe by pressing enter in an input
  $$1.on("submit", "[data-i-sync]", triggerSyncAndSave);
  $$1.on("click", "[data-i-sync] [data-i-trigger-sync]", triggerSyncAndSave);
}

function ajax(_ref) {
  var url = _ref.url,
      method = _ref.method,
      data = _ref.data,
      callback = _ref.callback;
  fetch(url, {
    method: method,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(data)
  }).then(function (res) {
    return res.json();
  }).then(function (res) {
    callback(res);
  });
}

function ajaxSimple(url, method, data, callback) {
  ajax({
    url: url,
    method: method,
    data: data,
    callback: callback
  });
}
function ajaxPost(url, data, callback) {
  ajaxSimple(url, "POST", data, callback);
}

var saveFunctionsLookup = {
  // default save function posts data to /save endpoint
  defaultSave: function defaultSave(_ref) {
    var data = _ref.data,
        path = _ref.path,
        saveToId = _ref.saveToId,
        elem = _ref.elem;
    ajaxPost("/save", {
      data: data,
      path: path,
      saveToId: saveToId
    }, function (res) {});
  }
};
function initSaveFunctions(saveFunctions) {
  Object.assign(saveFunctionsLookup, saveFunctions);
}
function enableSaveAttribute(afterSync) {
  afterSync(function (_ref2) {
    var elementsDataWasSyncedInto = _ref2.elementsDataWasSyncedInto,
        targetElement = _ref2.targetElement,
        shouldTriggerSave = _ref2.shouldTriggerSave;

    if (shouldTriggerSave) {
      elementsDataWasSyncedInto.forEach(function (elementDataWasSyncedInto) {
        callSaveFunction({
          elementDataWasSyncedInto: elementDataWasSyncedInto
        });
      });
    }
  });
}
function callSaveFunction(_ref3) {
  var elementDataWasSyncedInto = _ref3.elementDataWasSyncedInto,
      targetElement = _ref3.targetElement;
  // allow two different params that do the same things to be passed into this function: 
  // use `elementDataWasSyncedInto` when syncing, user `targetElement` when creating new data or removing data
  elementDataWasSyncedInto = elementDataWasSyncedInto || targetElement;
  var saveElement = elementDataWasSyncedInto.closest("[data-o-save-deep], [data-o-save]");

  if (saveElement) {
    var isDataInsideElem = saveElement.matches("[data-o-save-deep]");

    var _getSaveFuncInfo = getSaveFuncInfo(saveElement, isDataInsideElem),
        _getSaveFuncInfo2 = _slicedToArray(_getSaveFuncInfo, 3),
        saveFuncName = _getSaveFuncInfo2[0],
        savePath = _getSaveFuncInfo2[1],
        saveToId = _getSaveFuncInfo2[2];

    var saveFunc = saveFunctionsLookup[saveFuncName];

    if (saveFunc) {
      var dataFromSaveElement = isDataInsideElem ? getDataFromRootNode(saveElement) : getDataFromNode(saveElement);
      saveFunc({
        data: dataFromSaveElement,
        elem: elementDataWasSyncedInto,
        path: savePath,
        saveToId: saveToId
      });
    }
  }
}
function getSaveFuncInfo(saveElement, isDataInsideElem) {
  var dashCaseAttrName = isDataInsideElem ? "data-o-save-deep" : "data-o-save";
  var args = getAttributeValueAsArray(saveElement, dashCaseAttrName);
  var funcName, savePath, saveToId;
  args.forEach(function (arg) {
    if (arg.startsWith("path:")) {
      savePath = arg.substring(5);
    } else if (arg.startsWith("id:")) {
      saveToId = arg.substring(3);
    } else {
      funcName = arg;
    }
  });
  funcName = funcName || "defaultSave";
  return [funcName, savePath, saveToId];
}

function initRemoveAndHideEventListeners() {
  // useful for permanently removing items, especially from a list of similar items
  $$1.on("click", "[data-i-remove]", function (event) {
    // 1. find the nearest ancestor element that has the attribute `data-i-sync`
    var syncElement = event.currentTarget.closest("[data-i-sync]"); // 2. get the closest element with data on it

    var sourceElement = $$1.data(syncElement, "source");
    var elemWithData = sourceElement.closest('[data-o-type="object"]'); // 3. get parent element (because we can't call the save function on an elem that doesn't exist)

    var parentElem = elemWithData.parentNode; // 4. remove the data element

    elemWithData.remove(); // 5. save data

    callSaveFunction({
      targetElement: parentElem
    });
  }); // useful for hiding items the user doesn't want visible, but allowing them to add them back later

  $$1.on("click", "[data-i-hide]", function (event) {
    // 1. find the nearest ancestor element that has the attribute `data-i-sync`
    var syncElement = event.currentTarget.closest("[data-i-sync]"); // 2. look through the data keys and set ALL their values to empty strings

    forEachAttr(syncElement, function (attrName, attrValue) {
      if (attrName.startsWith("data-o-key-")) {
        syncElement.setAttribute(attrName, "");
      }
    }); // 3. save all the data as empty strings

    triggerSyncAndSave(event);
  });
}

function initChoiceAndToggleEventListeners () {
  // plain choice, using a <div> or <button> or <a>
  $$1.on("click", "[data-i][data-i-key][data-i-value]", function (event) {
    // get key name and value we want to change
    var keyName = event.currentTarget.getAttribute("data-i-key");
    var attributeValue = event.currentTarget.getAttribute("data-i-value"); // set value

    setValue({
      elem: event.currentTarget,
      keyName: keyName,
      attributeValue: attributeValue
    });
  }); // plain toggle, using a <div> or <button> or <a>
  // data-i-toggle data-i-key="done" data-i-value="true"
  // finds matching data-o-key-* and alternates between setting "true" and ""

  $$1.on("click", "[data-i-toggle]", function (event) {
    var keyName = event.currentTarget.getAttribute("data-i-toggle"); // set value

    setValue({
      elem: event.currentTarget,
      keyName: keyName,
      attributeValue: "true",
      toggleValue: true
    });
  }); // <radio> AND <select>

  $$1.on("change", "[data-i][type='radio'], select[data-i]", function (event) {
    // get key name and value we want to change
    var keyName = event.currentTarget.getAttribute("name");
    var attributeValue = event.currentTarget.value; // set value

    setValue({
      elem: event.currentTarget,
      keyName: keyName,
      attributeValue: attributeValue
    });
  }); // <checkbox>

  $$1.on("change", "[data-i][type='checkbox']", function (event) {
    // get key name and value we want to change
    var keyName = event.currentTarget.getAttribute("name");
    var attributeValue = event.currentTarget.checked ? event.currentTarget.value : ""; // set value

    setValue({
      elem: event.currentTarget,
      keyName: keyName,
      attributeValue: attributeValue
    });
  });
}

function setValue(_ref) {
  var elem = _ref.elem,
      keyName = _ref.keyName,
      attributeValue = _ref.attributeValue,
      toggleValue = _ref.toggleValue;
  // 1. form the output attribute key name
  var dashCaseKeyName = camelCaseToDash(keyName);
  var attributeName = "data-o-key-" + dashCaseKeyName; // 2. look for the closest element with that output attribute

  var dataSourceElem = elem.closest("[" + attributeName + "]"); // 3. set the `data-o-key-*` attribute representing the selected choice on the choice element

  if (!toggleValue) {
    dataSourceElem.setAttribute(attributeName, attributeValue);
  } else {
    if (!dataSourceElem.getAttribute(attributeName)) {
      dataSourceElem.setAttribute(attributeName, attributeValue);
    } else {
      dataSourceElem.setAttribute(attributeName, "");
    }
  } // 4. call watch functions since the data is changing


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
    var camelCaseKeyName = event.currentTarget.getAttribute("name"); // 3. convert camel case to dash case

    var dashCaseKeyName = camelCaseToDash(camelCaseKeyName); // 4. form the attribute name from the dash case key name

    var attrName = "data-o-key-" + dashCaseKeyName; // 5. get the closest matching [data-o-key-*] element

    var outputElem = event.currentTarget.closest("[" + attrName + "]"); // 6. get the value of the input

    var newValue = event.currentTarget.value; // 7. set the value of its key to the input's value

    outputElem.setAttribute(attrName, newValue); // 8. call watch functions
    // we want this so form validation is easier inside inline edit popovers
    // todo: figure out how to NOT call this on every keypress, whether that's debouncing it or simply not calling it

    callWatchFunctions({
      dashCaseKeyName: dashCaseKeyName,
      parentOfTargetElements: outputElem,
      value: newValue,
      dataSourceElem: outputElem
    });
  });
}

function initClickToSaveEventListener () {
  $$1.on("click", "[data-i-click-to-save]", function (event) {
    var clickedElem = event.currentTarget;
    var attributeValue = clickedElem.getAttribute("data-i-click-to-save");

    if (attributeValue === "closest") {
      // setTimeout gives other click events on this element time to fire before the data is saved
      setTimeout(function () {
        callSaveFunction({
          targetElement: clickedElem
        });
      });
    }
  });
}

var map = typeof Map === "function" ? new Map() : function () {
  var keys = [];
  var values = [];
  return {
    has: function has(key) {
      return keys.indexOf(key) > -1;
    },
    get: function get(key) {
      return values[keys.indexOf(key)];
    },
    set: function set(key, value) {
      if (keys.indexOf(key) === -1) {
        keys.push(key);
        values.push(value);
      }
    },
    "delete": function _delete(key) {
      var index = keys.indexOf(key);

      if (index > -1) {
        keys.splice(index, 1);
        values.splice(index, 1);
      }
    }
  };
}();

var createEvent = function createEvent(name) {
  return new Event(name, {
    bubbles: true
  });
};

try {
  new Event('test');
} catch (e) {
  // IE does not support `new Event()`
  createEvent = function createEvent(name) {
    var evt = document.createEvent('Event');
    evt.initEvent(name, true, false);
    return evt;
  };
}

function assign(ta) {
  if (!ta || !ta.nodeName || ta.nodeName !== 'TEXTAREA' || map.has(ta)) return;
  var heightOffset = null;
  var clientWidth = null;
  var cachedHeight = null;

  function init() {
    var style = window.getComputedStyle(ta, null);

    if (style.resize === 'vertical') {
      ta.style.resize = 'none';
    } else if (style.resize === 'both') {
      ta.style.resize = 'horizontal';
    }

    if (style.boxSizing === 'content-box') {
      heightOffset = -(parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
    } else {
      heightOffset = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    } // Fix when a textarea is not on document body and heightOffset is Not a Number


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
      var width = ta.style.width;
      ta.style.width = '0px'; // Force reflow:

      /* jshint ignore:start */

      ta.offsetWidth;
      /* jshint ignore:end */

      ta.style.width = width;
    }
    ta.style.overflowY = value;
  }

  function getParentOverflows(el) {
    var arr = [];

    while (el && el.parentNode && el.parentNode instanceof Element) {
      if (el.parentNode.scrollTop) {
        arr.push({
          node: el.parentNode,
          scrollTop: el.parentNode.scrollTop
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

    var overflows = getParentOverflows(ta);
    var docTop = document.documentElement && document.documentElement.scrollTop; // Needed for Mobile IE (ticket #240)

    ta.style.height = '';
    ta.style.height = ta.scrollHeight + heightOffset + 'px'; // used to check if an update is actually necessary on window.resize

    clientWidth = ta.clientWidth; // prevents scroll-position jumping

    overflows.forEach(function (el) {
      el.node.scrollTop = el.scrollTop;
    });

    if (docTop) {
      document.documentElement.scrollTop = docTop;
    }
  }

  function update() {
    resize();
    var styleHeight = Math.round(parseFloat(ta.style.height));
    var computed = window.getComputedStyle(ta, null); // Using offsetHeight as a replacement for computed.height in IE, because IE does not account use of border-box

    var actualHeight = computed.boxSizing === 'content-box' ? Math.round(parseFloat(computed.height)) : ta.offsetHeight; // The actual height not matching the style height (set via the resize method) indicates that 
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
      var evt = createEvent('autosize:resized');

      try {
        ta.dispatchEvent(evt);
      } catch (err) {// Firefox will throw an error on dispatchEvent for a detached element
        // https://bugzilla.mozilla.org/show_bug.cgi?id=889376
      }
    }
  }

  var pageResize = function pageResize() {
    if (ta.clientWidth !== clientWidth) {
      update();
    }
  };

  var destroy = function (style) {
    window.removeEventListener('resize', pageResize, false);
    ta.removeEventListener('input', update, false);
    ta.removeEventListener('keyup', update, false);
    ta.removeEventListener('autosize:destroy', destroy, false);
    ta.removeEventListener('autosize:update', update, false);
    Object.keys(style).forEach(function (key) {
      ta.style[key] = style[key];
    });
    map["delete"](ta);
  }.bind(ta, {
    height: ta.style.height,
    resize: ta.style.resize,
    overflowY: ta.style.overflowY,
    overflowX: ta.style.overflowX,
    wordWrap: ta.style.wordWrap
  });

  ta.addEventListener('autosize:destroy', destroy, false); // IE9 does not fire onpropertychange or oninput for deletions,
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
    destroy: destroy,
    update: update
  });
  init();
}

function destroy(ta) {
  var methods = map.get(ta);

  if (methods) {
    methods.destroy();
  }
}

function update(ta) {
  var methods = map.get(ta);

  if (methods) {
    methods.update();
  }
}

var autosize = null; // Do nothing in Node.js environment and IE8 (or lower)

if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
  autosize = function autosize(el) {
    return el;
  };

  autosize.destroy = function (el) {
    return el;
  };

  autosize.update = function (el) {
    return el;
  };
} else {
  autosize = function autosize(el, options) {
    if (el) {
      Array.prototype.forEach.call(el.length ? el : [el], function (x) {
        return assign(x);
      });
    }

    return el;
  };

  autosize.destroy = function (el) {
    if (el) {
      Array.prototype.forEach.call(el.length ? el : [el], destroy);
    }

    return el;
  };

  autosize.update = function (el) {
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
    var editableTriggerElem = event.currentTarget;

    var _getEditableInfo = getEditableInfo(editableTriggerElem),
        _getEditableInfo2 = _slicedToArray(_getEditableInfo, 2),
        switchName = _getEditableInfo2[0],
        editableConfigString = _getEditableInfo2[1];

    var editablePopoverElem = document.querySelector(".remake-edit");
    var editableConfig = processAttributeString(editableConfigString); // [{name, modifier, args: []}]
    // remove old output key attributes

    removeOutputDataAttributes({
      elem: editablePopoverElem,
      keep: []
    }); // add output key attributes defined in the editable config

    addDataOutputKeys({
      elem: editablePopoverElem,
      config: editableConfig
    }); // add form field types to single attribute from editable config

    addFormFieldsBeingEdited({
      elem: editablePopoverElem,
      config: editableConfig
    }); // render html inside the edit popover

    var remakeEditAreasElem = editablePopoverElem.querySelector(".remake-edit__edit-areas");
    remakeEditAreasElem.innerHTML = generateRemakeEditAreas({
      config: editableConfig
    }); // copy the layout

    copyLayout({
      sourceElem: editableTriggerElem,
      targetElem: editablePopoverElem,
      dimensionsName: "width",
      xOffset: 0,
      yOffset: 0
    }); // trigger the switch on

    var switchObj = {
      name: switchName,
      elem: editablePopoverElem
    };
    var actionObj = {
      name: switchName,
      elem: editableTriggerElem,
      type: "on"
    };
    Switches.turnOn(switchObj, actionObj); // autosize textarea

    var textareaElems = Array.from(remakeEditAreasElem.querySelectorAll("textarea"));
    setTimeout(function () {
      textareaElems.forEach(function (el) {
        return autosize$1(el);
      });
    }); // focus input

    var firstFormInput = editablePopoverElem.querySelector("textarea, input");
    firstFormInput.focus();
  });
  $$1.on("click", ".remake-edit__button:not([type='submit'])", function (event) {
    event.preventDefault();
  });
}

function getEditableInfo(elem) {
  if (elem.hasAttribute("data-i-editable")) {
    return ["remakeEdit", elem.getAttribute("data-i-editable")];
  } else if (elem.hasAttribute("data-i-editable-with-remove")) {
    return ["remakeEditWithRemove", elem.getAttribute("data-i-editable-with-remove")];
  } else if (elem.hasAttribute("data-i-editable-with-hide")) {
    return ["remakeEditWithHide", elem.getAttribute("data-i-editable-with-hide")];
  }
}

function removeOutputDataAttributes(_ref) {
  var elem = _ref.elem,
      keep = _ref.keep;
  var attributesToRemove = [];
  forEachAttr(elem, function (attrName, attrValue) {
    if (attrName.startsWith("data-o-key-")) {
      if (!keep.includes(attrName)) {
        attributesToRemove.push(attrName);
      }
    }
  });
  attributesToRemove.forEach(function (attrName) {
    return elem.removeAttribute(attrName);
  });
}

function addDataOutputKeys(_ref2) {
  var elem = _ref2.elem,
      config = _ref2.config;
  config.forEach(function (obj) {
    elem.setAttribute("data-o-key-" + camelCaseToDash(obj.name), "");
  });
}

function addFormFieldsBeingEdited(_ref3) {
  var elem = _ref3.elem,
      config = _ref3.config;
  var attrValue = config.map(function (obj) {
    return obj.modifier;
  }).join(" ");
  elem.setAttribute("data-remake-edit-fields", attrValue);
}

function generateRemakeEditAreas(_ref4) {
  var config = _ref4.config;
  // e.g. {name: "blogTitle", modifier: "text-single-line", args: []}
  var outputHtml = "";
  config.forEach(function (_ref5) {
    var modifier = _ref5.modifier,
        name = _ref5.name;
    var formFieldHtml;

    if (modifier === "text-single-line") {
      formFieldHtml = "<input class=\"remake-edit__input\" data-i=\"\" name=\"".concat(name, "\" type=\"text\">");
    }

    if (modifier === "text-multi-line") {
      formFieldHtml = "<textarea class=\"remake-edit__textarea\" data-i=\"\" name=\"".concat(name, "\"></textarea>");
    }

    outputHtml += "<div class=\"remake-edit__edit-area\">".concat(formFieldHtml, "</div>");
  });
  return outputHtml;
}

function insertRemakeEditPopoverHtml() {
  var htmlString = "\n  <style>\n    .remake-edit {\n      box-sizing: border-box;\n      display: none;\n      position: absolute;\n      font-family: inherit;\n    }\n\n    .remake-edit * {\n      box-sizing: border-box;\n    }\n\n    [data-switched-on~=\"remakeEdit\"], [data-switched-on~=\"remakeEditWithRemove\"], [data-switched-on~=\"remakeEditWithHide\"] {\n      display: block;\n    }\n\n    .remake-edit__backdrop {\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background-color: rgba(0, 0, 0, 0.7);\n      z-index: 9;\n    }\n\n    .remake-edit__edit-container {\n      position: absolute;\n      z-index: 10;\n      min-width: 280px;\n      width: 100%;\n    }\n\n    .remake-edit__edit-areas {\n      margin-bottom: 8px;\n    }\n\n    .remake-edit__textarea, .remake-edit__input {\n      display: block;\n      width: 100%;\n      padding: 7px 14px 9px;\n      font-size: 18px;\n      border: none;\n      outline: none;\n      line-height: 1.4em;\n      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);\n      border-radius: 5px;\n    }\n\n    .remake-edit__textarea {\n      min-height: 48px;\n      resize: none;\n    }\n\n    .remake-edit__buttons {\n      display: flex;\n    }\n\n    .remake-edit__button {\n      display: inline-block;\n      margin: 0 8px 0 0;\n      padding: 7px 14px 9px;\n      border: 0;\n      outline: none;\n      font-size: 18px;\n      color: #fff;\n      background-color: #228be6;\n      line-height: 1em;\n      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);\n      border-radius: 5px;\n      cursor: pointer;\n      user-select: none;\n      text-decoration: none;\n    }\n\n    .remake-edit__button:last-child {\n      margin: 0;\n    }\n\n    .remake-edit__button:hover {\n      background-color: #0b6cbf;\n      color: #fff;\n      text-decoration: none;\n    }\n\n    .remake-edit__button--remove, .remake-edit__button--hide {\n      display: none;\n      background-color: #e03131;\n    }\n\n    .remake-edit__button--remove:hover, .remake-edit__button--hide:hover {\n      background-color: #b42626;\n      color: #fff;\n    }\n\n    [data-switched-on~=\"remakeEditWithRemove\"] .remake-edit__button--remove, [data-switched-on~=\"remakeEditWithHide\"] .remake-edit__button--hide {\n      display: inline-block;\n    }\n\n    .remake-edit__button--cancel {\n      margin-left: auto;\n      background-color: #868E96;\n    }\n\n    .remake-edit__button--cancel:hover {\n      background-color: #64707d;\n      color: #fff;\n    }\n  </style>\n  <div id=\"remake__auto-generated\">\n    <form \n      class=\"remake-edit\" \n\n      data-i-sync\n      data-switches=\"remakeEdit(no-auto) remakeEditWithRemove(no-auto) remakeEditWithHide(no-auto)\"\n\n      data-o-type=\"object\"\n    >\n      <div \n        class=\"remake-edit__backdrop\"\n        data-switch-actions=\"remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)\"\n      ></div>\n      <div class=\"remake-edit__edit-container\">\n        <div class=\"remake-edit__edit-areas\">\n        </div>\n        <div class=\"remake-edit__buttons\">\n          <a \n            class=\"remake-edit__button remake-edit__button--remove\" \n            href=\"#\"\n            data-i-remove\n            data-switch-actions=\"remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)\"\n          >remove</a>\n          <a \n            class=\"remake-edit__button remake-edit__button--hide\" \n            href=\"#\"\n            data-i-hide\n            data-switch-actions=\"remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)\"\n          >remove</a>\n          <a \n            class=\"remake-edit__button remake-edit__button--cancel\" \n            href=\"#\"\n            data-switch-actions=\"remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)\"\n          >cancel</a>\n          <button \n            class=\"remake-edit__button remake-edit__button--save\" \n            type=\"submit\"\n            data-switch-actions=\"remakeEdit(off) remakeEditWithRemove(off) remakeEditWithHide(off)\"\n          >save</button>\n        </div>\n      </div>\n    </form>\n  </div>";
  document.body.insertAdjacentHTML("beforeend", htmlString);
}

function initAddingItemEventListener () {
  $$1.on("click", "[data-i-new]", function (event) {
    var triggerElem = event.currentTarget; // parse the data attribute to get the selector and the template name

    var _getAttributeValueAsA = getAttributeValueAsArray(triggerElem, "data-i-new"),
        _getAttributeValueAsA2 = _slicedToArray(_getAttributeValueAsA, 3),
        templateName = _getAttributeValueAsA2[0],
        selector = _getAttributeValueAsA2[1],
        position = _getAttributeValueAsA2[2]; // pass the template name into an endpoint and get the resulting html back


    ajaxPost("/new", {
      templateName: templateName
    }, function (res) {
      var htmlString = res.htmlString; // find the closest element matching the selector

      var listElem = findInParents(triggerElem, selector); // insert the rendered template into that element

      var whereToInsert = position === "top" ? "afterbegin" : "beforeend";
      listElem.insertAdjacentHTML(whereToInsert, htmlString);
      callSaveFunction({
        targetElement: listElem
      });

      if (optionsData.addItemCallback) {
        var itemElem = position === "top" ? listElem.firstElementChild : listElem.lastElementChild;
        optionsData.addItemCallback({
          listElem: listElem,
          itemElem: itemElem,
          templateName: templateName
        });
      }
    });
  });
}

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Built-in value references. */
var Symbol$1 = root.Symbol;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype,
    objectProto$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty ? identity : function(func, string) {
  return defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$2.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString(overRest(func, start, identity), func + '');
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$4;

  return value === proto;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$5.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$5.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty$3.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag$1 = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/** Detect free variable `exports`. */
var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports$1 && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule$1 && freeModule$1.require && freeModule$1.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$6.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$4.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$7.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty$5.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$8.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty$6.call(data, key) ? data[key] : undefined;
}

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty$7.call(data, key);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
  return this;
}

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/* Built-in method references that are verified to be native. */
var Map$2 = getNative(root, 'Map');

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map$2 || ListCache),
    'string': new Hash
  };
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

/** `Object#toString` result references. */
var objectTag$1 = '[object Object]';

/** Used for built-in method references. */
var funcProto$2 = Function.prototype,
    objectProto$a = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$2 = funcProto$2.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString$2.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag$1) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty$8.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString$2.call(Ctor) == objectCtorString;
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map$2 || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/** Detect free variable `exports`. */
var freeExports$2 = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$2 = freeExports$2 && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

/** Built-in value references. */
var Buffer$1 = moduleExports$2 ? root.Buffer : undefined,
    allocUnsafe = Buffer$1 ? Buffer$1.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq(object[key], value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Gets the value at `key`, unless `key` is "__proto__".
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function safeGet(object, key) {
  if (key == '__proto__') {
    return;
  }

  return object[key];
}

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = safeGet(object, key),
      srcValue = safeGet(source, key),
      stacked = stack.get(srcValue);

  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    var isArr = isArray(srcValue),
        isBuff = !isArr && isBuffer(srcValue),
        isTyped = !isArr && !isBuff && isTypedArray(srcValue);

    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      }
      else if (isBuff) {
        isCommon = false;
        newValue = cloneBuffer(srcValue, true);
      }
      else if (isTyped) {
        isCommon = false;
        newValue = cloneTypedArray(srcValue, true);
      }
      else {
        newValue = [];
      }
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      newValue = objValue;
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      }
      else if (!isObject(objValue) || isFunction(objValue)) {
        newValue = initCloneObject(srcValue);
      }
    }
    else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  assignMergeValue(object, key, newValue);
}

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  baseFor(source, function(srcValue, key) {
    if (isObject(srcValue)) {
      stack || (stack = new Stack);
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  }, keysIn);
}

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = createAssigner(function(object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});

function initInputEventListeners(options) {
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

var init = initInputEventListeners;

export { $$1 as $, Switches, callMultipleWatchFunctions, callSaveFunction, copyLayout, getDataAndDataSourceElemFromNodeAndAncestors, getDataFromNode, getDataFromRootNode, getLocationKeyValue, getValueAndDataSourceElemFromKeyName, init, initInputEventListeners, initSaveFunctions, setLocationKeyValue, setValueForKeyName };
