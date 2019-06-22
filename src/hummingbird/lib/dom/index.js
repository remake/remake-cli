// TRAVERSING & ASSEMBLING DOM UTILS

export function forEachAncestorMatch ({elem, selector, callback}) {
  let matchingElem = elem.closest(selector);

  if (matchingElem) {
    callback(matchingElem);

    let matchingElemParent = matchingElem.parentNode;
    if (matchingElemParent) {
      forEachAncestorMatch({elem: matchingElemParent, selector, callback});
    }
  }
}

export function forEachMatchingElem (parentElem, selector, callback) {
  if (parentElem.matches(selector)) {
    callback(parentElem);
  }

  let childMatches = Array.from(parentElem.querySelectorAll(selector));

  childMatches.forEach((childMatch) => {
    callback(childMatch);
  });
}


// get an element's parents, optionally filtering them by a selector
export function getParents ({elem, selector, includeCurrentElement}) {
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
export function findInParents (elem, selector) {
  let foundElem = elem.parentElement.querySelector(selector);
  if (foundElem || elem.parentElement === document.documentElement) {
    return foundElem;
  } else {
    return findInParents(elem.parentElement, selector);
  }
}


// LOOPING OVER ELEMENT ATTRIBUTES

export function forEachAttr (elem, fn) {
  let attributes = elem.attributes;
  let attributesLength = attributes.length;

  for (var i = 0; i < attributesLength; i++) {
    let attrName = attributes[i].name;
    let attrValue = attributes[i].value;

    fn(attrName, attrValue);
  }
}


// ELEMENT POSITION

export function getElementOffset (el) {
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
};




