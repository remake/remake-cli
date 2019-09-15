const path = require("upath");
const jsonfile = require("jsonfile");

let usernameCantBeTheseWords = jsonfile.readFileSync(path.join(__dirname, "../config/username-cant-be-these-words.json"));
let usernameCantBeThesePluralizedWords = usernameCantBeTheseWords.map(w => w + "s");
let usernameCantIncludeTheseWords = jsonfile.readFileSync(path.join(__dirname, "../config/usernames-cant-include-these-words.json"));

let usernameCantBeTheseWordsLength = usernameCantBeTheseWords.length;
let usernameCantBeThesePluralizedWordsLength = usernameCantBeTheseWordsLength;
let usernameCantIncludeTheseWordsLength = usernameCantIncludeTheseWords.length;

export function getReservedWordInfo (word) {
  word = word.toLowerCase();

  for (var i = 0; i < usernameCantBeTheseWordsLength; i++) {
    if (word === usernameCantBeTheseWords[i]) {
      return {isReserved: true, reservedWord: usernameCantBeTheseWords[i]};
    }
  }

  for (var i = 0; i < usernameCantBeThesePluralizedWordsLength; i++) {
    if (word === usernameCantBeThesePluralizedWords[i]) {
      return {isReserved: true, reservedWord: usernameCantBeThesePluralizedWords[i]};
    }
  }

  for (var i = 0; i < usernameCantIncludeTheseWordsLength; i++) {
    if (word.includes(usernameCantIncludeTheseWords[i])) {
      return {isReserved: true, reservedWord: usernameCantIncludeTheseWords[i]};
    }
  }

  return {isReserved: false};
}













