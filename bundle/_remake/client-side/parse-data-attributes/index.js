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

// matches everything but the special characters that mean something (i.e. "(", ")", ":", ",", "]")
let regexForPhrase = /^[^\(\):,\s]+$/;
let regexForPhraseOrSpecialCharacter = /([^\(\):,\s]+|[\(\):,]+)/g;

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

    // covers two cases: either we've just passed the modifier OR we're processing args
    if (previousPart === ":" || (previousPart === "(" && nextPart !== ":" && nextPart !== ")")) {
      hasModifierBeenProcessed = true;
    }

    // reset if we're leaving a section
    if (currentPart === ")") {
      currentObject = undefined;
      isWithinParens = false;
      hasModifierBeenProcessed = false;
    }

    if (regexForPhrase.test(currentPart) && (nextPart === "(" || (!isWithinParens && currentPart !== "(" && currentPart !== ")"))) {
      // create new object and add it to final array
      currentObject = {};
      extractedObjects.push(currentObject);

      // this part is the "name" if it comes right before "("
      currentObject.name = currentPart.trim();
    }

    if (previousPart === "(" && (nextPart === ":" || nextPart === ")")) {
      // this part is the "modifier" if it comes right after "(" and right before ":" OR a ")"
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

// turns strings like:
// "favoriteColor(colorPicker: red blue orange green) profileName(text-single-line)"
// into:
// [{name: "favoriteColor", modifier: "colorPicker", args: ["red, blue, orange, green"]}, {name: "profileName", modifier: "text-single-line"}]
// 
// rules
// - each section is defined by a this structure: `string(string: string string string)`
// - `name` is the first string in each section 
// - `modifier` is always the first string inside the parentheses
// - `args` are always after the modifier
// - modifier, args, and parentheses are all optional, but in order to have args you 
//   need a modifier and in order to have a modifier, you need parentheses
function processAttributeString (attributeString) {
  let parts = getParts(attributeString);
  let extractedObjects = assembleResult(parts);

  return extractedObjects;
}



export {
  parseSwitchAttributes,
  parseSwitchActionAttributes,
  parseSwitchStopAttributes,
  parseSwitchedOnAttributes,
  parseCopyLayoutAttributes,
  parseCopyPositionAttributes,
  parseCopyDimensionsAttributes,
  parseStringWithIndefiniteNumberOfParams,
  formatSpaces,
  getAttributeValueAsArray,
  processAttributeString
};




