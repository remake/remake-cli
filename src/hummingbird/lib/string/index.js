export function isStringANumber (str) {
  return /^\d+$/.test(str);
}

// won't work with consecutive hyphens
export function dashToCamelCase(str) {
  return str.replace(/-([a-z])/g, (match) => match[1].toUpperCase());
}

// won't work with two consecutive uppercase letters e.g. "thisIsABundle"
export function camelCaseToDash (str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}