import nanoidGenerate from "nanoid/generate";
const nanoidLength = 14;
const nanoidAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Collision probability of unique ids (source: https://zelark.github.io/nano-id-cc/): 
export default function getUniqueId () {
  return nanoidGenerate(nanoidAlphabet, nanoidLength);
}