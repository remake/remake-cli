---
layout: layout.hbs
title: Attach Data to Elements - Remake Framework Docs
---

## Attach Data to Elements

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/-ihDFiLa0Pc" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### An app in a single file

The entire app we're building in these tutorial videos fits inside of only one file, `app/app-index.hbs` (called <code>username.hbs</code> before <code>v1.11</code>), and is 73 lines long.

If you want to start with a blank slate, with only an HTML file, like we do in the video, you can replace your current `app-index.hbs` template with this one: [starter-app-index.hbs](https://gist.github.com/panphora/a1f39772ebc837b29173c5fb18887a8d).

Also, make sure you're logged in to the app.

### A quick note on saving

If you're following along with the video and you want your data to auto-save whenever the page loads (not a great idea in production, but fine in development), then comment out the last line in your `remake-init.js` file:

```js
Remake.callSaveFunction({targetElement: document.body});
```

### Remake's Custom Data Attributes

All of the work Remake allows us to do — creating a complete Kanban app from scratch in record time — is done by only 8 custom attributes (used a total of 22 times).

**Learning what the following custom attributes do is the single most important thing you can do to learn Remake.**

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
      * It can also be customized to look at different properties if necessary
* **data-l-target-***
  * If an element with this attribute is included inside an element with a matching `data-l-key-` attribute, then Remake will assume this element has the key's value
    * An example of matching attributes: `data-l-key-blog-post-header` matches `data-target-key-blog-post-header` because the part after `-key-` matches
* **data-i-editable**
  * This marks an element as able to trigger an editable popover.
  * By default, when an element with this attribute is clicked, Remake will look for data on the current element — inside `data-o-key-` and `data-l-key-` attributes. If it finds some keys with data in them, it will trigger editable areas for each of them.
    * If no data is found on the current element (i.e. it doesn't have a `data-o-type="object"` attribute), the parent element will be examined for data — and then its parent... on and on until an element with editable data is found.
    * Using a custom syntax for the value of this attribute, you can control which keys are edited and which types of editable areas are triggered.
* **data-i-new**
  * This marks an element as able to render new data onto the page.
  * At minimum, this attribute needs its value to be set to **either**:
    * The name of a partial template
    * The name of an item that was iterated over with a `#for` loop
  * By default, this attribute will:
    1. Find a template whose name matches the name of the attribute's value
    2. Render the template it found into the nearest element with a `data-o-type="list"` attribute ("nearest" is defined as inside the same parent, or grandparent, or great grandparent, etc., until a match is found)
  * It's possible to use a custom syntax for the value of this attribute to define exactly which element the template will be rendered into and where (i.e. "top" or "bottom")
* **data-i-sortable**
  * Attach this attribute to an element to mark it as a sortable list. All the elements inside of the current element will be draggable and sortable.
  * This attribute requires a value. 
    * If the value matches the value of other `data-i-sortable` elements on the page, then the sortable elements will be able to be shared and dragged between them
    * If the value of this attribute is unique across the page, elements inside the current element will only be sortable within the current element
* **data-o-default-***
  * This attribute lets you set a default value for a `data-o-key-` or `data-l-key-` attribute if one of those attributes value is set to an empty string
    * Use case: sometimes you don't want editable elements to have empty values
  * To use this, attach it to the same element that a `data-o-key-` or `data-l-key-` attribute is on and match its key to their key
    * Example of matching key names: `data-o-key-favorite-color` and `data-o-default-favorite-color` match

To learn more, check out the [Data Attributes API](http://localhost:8080/data-attributes-api/) page!

<div class="spacer--8"></div>

<a class="slanted-link" href="/rendering-data/"><span>&rarr; Next: Rendering Data</span></a>



