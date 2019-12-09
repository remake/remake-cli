---
layout: layout.hbs
---

## Attach Data to Elements

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/-ihDFiLa0Pc" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### An app in a single file

The entire app we're building in these tutorial videos fits inside of only one file, `app/username.hbs`, and is 73 lines long.

If you want to start with a blank slate, with only an HTML file, like we do in the video, you can replace your current `username.hbs` template with this one: [starter-username.hbs](https://gist.github.com/panphora/a1f39772ebc837b29173c5fb18887a8d).

Also, make sure you're logged in to the app.

### A quick note on saving

If you're following along with the video and you want your data to auto-save whenever the page loads (not a great idea in production, but fine in development), then comment out the last line in your `remake-init.js` file:

```js
Remake.callSaveFunction({targetElement: document.body});
```

### Only a few attributes to learn!

All of the work in this Remake app is done by 8 powerful custom attributes.

Here's a list of all the attributes and what they do:

* **data-o-type**
  * This can mark an element as representating either an `"object"` or a `"list"`.
  * Elements with this attribute can be nested inside of each other and Remake will do its best to also nest the data that's extracted from them.
    * For example, multiple elements representing `object`s can be nested inside of an element representing a `list`, and a `list` of `object`s will be extracted.
    * If an `object` is nested inside another `object`, it will be merged with the parent object unless it belong to a key inside the parent object.
* **data-o-key**
  * Attaching this attribute to an `object` or `list` marks it as belonging a key inside the parent object.
* **data-o-key-***
  * For an element marked as an `"object"`, this attribute defines a key/value pair. 
    * The key name is whatever dash-case value follows `"data-o-key-"` and, when extracted, will be converted to camelCase
    * The value is whatever `string` value the attribute is set to
* **data-l-key-***
  * For an element marked as an `"object"`, this attribute defines a key/value pair.
    * The key name is whatever dash-case value follows `"data-l-key-"` and, when extracted, will be converted to camelCase
    * The value is, by default, either:
      * The `innerText` of a child element with a matching `data-target-key-` attribute
      * Or, if that's not found, it's the `innerText` of the current element
* **data-i-editable**
* **data-i-new**
* **data-i-sortable**
* **data-l-target-***
* **data-o-default-***

To learn more about these, read the [Data Attributes API](http://localhost:8080/data-attributes-api/) page!

<div class="spacer--8"></div>

<a class="slanted-link" href="/rendering-data/"><span>&rarr; Next: Rendering Data</span></a>



