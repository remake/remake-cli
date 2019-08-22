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

import {on, off, fire} from 'delegated-events'; // an excellent library for delegated events

var $ = function (selector) {
  return new QueryObj(selector);
}

$.on = on;
$.off = off;
$.fire = fire;

let data = [];
$.data = function (elem, key, value) {
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
}

$.arr = function (arrLike) {
  if (arrLike === null || arrLike === undefined) {
    return [];
  } else {
    return Array.from(arrLike);
  }
}

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
      
      $.data(elem, key, value);
    }
  }
  on(name, cb) {
    this.arr.forEach(el => {
      el.addEventListener(name, cb);
    });
  }
}

window.$ = $;

export { $ };


