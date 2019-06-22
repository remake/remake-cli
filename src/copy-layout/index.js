import { $ } from '../queryjs';
import { getElementOffset } from '../hummingbird/lib/dom';
import { 
  parseCopyLayoutAttributes,
  parseCopyPositionAttributes,
  parseCopyDimensionsAttributes
} from '../parse-data-attributes'; 

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

$.on("click", "[data-copy-layout], [data-copy-position], [data-copy-dimensions]", (event) => {
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
  $(selectorForDimensionsTarget).arr.forEach((targetElem) => {

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
  $(selectorForPositionTarget).arr.forEach((targetElem) => {

    // set a new top position
    targetElem.style.top = top + "px";

    // set a new left position
    targetElem.style.left = left + "px";

  });
}

// for external use. the other methods would need to be adapted before they're exported
export function copyLayout ({sourceElem, targetElem, dimensionsName = "width", xOffset = 0, yOffset = 0} = {}) {
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










