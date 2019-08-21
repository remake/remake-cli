let isObject = (a) => typeof a === "object" && a !== null && !Array.isArray(a);
let isArray = (a) => Array.isArray(a);
let forEachKeyValuePair = (obj, cb) => {
  Object.keys(obj).forEach(function (k) {
    cb(k, obj[k]);
  });
};
let fillMissingKeys = (target, source) => {
  forEachKeyValuePair(source, (key, value) => {
    if (target[key] === undefined) {
      target[key] = value;
    }
  });
}
let findById = (arrayToSearch, objWithId) => arrayToSearch.find(a => a.id === objWithId.id);


// this will modify target, filling in data from source, using an `id` key to find matching objects inside arrays
//   this function assumes source and target are of the same type (even in recursive loops)
export function specialDeepExtend (source, target) {

  if (isArray(target)) {

    // overwrite the source if the data types don't match (would prefer not to do this)
    if (!isArray(source)) {
      source = [];
    }

    // loop through children of target data
    target.forEach(function (targetChild) {

      // for each child, find match in source data using the id
      let matchingSourceChild = findById(source, targetChild);

      // if source data found
      if (matchingSourceChild) {

        // call this function recursively on the child and matching child
        specialDeepExtend(targetChild, matchingSourceChild);

        // fill missing keys in the target data using the source data
        fillMissingKeys(targetChild, matchingSourceChild);

      }
    });

  }

  if (isObject(target)) {

    // for each key/value pair in target data
    forEachKeyValuePair(target, function (key, targetValue) {

      // if value is an object or array in BOTH the source AND target data
      let sourceValue = source[key];

      if ((isObject(sourceValue) || isArray(sourceValue)) && (isObject(targetValue) || isArray(targetValue))) {
        
        // call this function recursively on these children
        specialDeepExtend(sourceValue, targetValue);

      }

    });

    // fill missing keys in the target data using the source data
    fillMissingKeys(target, source);

  }

  return target;

}







