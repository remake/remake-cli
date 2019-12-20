---
layout: layout.hbs
title: Data Attributes API - Remake Framework Docs
---

# Data Attributes API

Remake relies on data attributes for storing data inside of elements and defining an application's behavior.

In fact, you can create a fully working web application in Remake by just using data attributes.

<h2 class="api" id="data-o">Attaching Data to Elements</h2>

### `data-o-type`

By adding this attribute to an HTML element, you're telling Remake that there's data on (and possibly inside) the element. Remake scans the page for all elements with a `data-o-type` attribute and converts them into data.

Remake can convert an element into one of two data structures: an **object** or **array**.

To define an array, use `data-o-type="list"`.

To define an object, use `data-o-type="object"`.

These will be converted into `[]` and `{}`, respectively.

**Example of an object nested inside an array:**

```html
<div data-o-type="list">
  <div data-o-type="object"></div>
</div>
```

This is valid Remake code and will be converted into `[{}]`.


### `data-o-key="someKeyName"`

This attribute allows you to namespace data inside an object.

Normally, if there's an object nested in another object, they'll be merged into a single object:

```html
<div data-o-type="object">
  <div data-o-type="object">
  </div>
</div>
```

The above, for example, is converted into `{}`.

However, if you give the nested element a key name with the `data-o-key` attribute, it'll use that key to nest itself inside the parent object.

```html
<div data-o-type="object">
  <div data-o-key="someData" data-o-type="object">
  </div>
</div>
```

Now the nested object is inside the provided key name: `{someData: {}}`.

---

Now that we know how to attach data structures like arrays and objects to the page, but what about storing things like strings and numbers?

### `data-o-key-[some-key-name]`

This attribute lets you attach key/value pairs to an element. 

You must always use the `data-o-type="object"` attribute in addition to this attribute.

You can attach as many key/value pairs to the same element as you want, as long as their key names are unique.

For example:

```html
<div 
  data-o-type="object" 
  data-o-key-first-name="David" 
  data-o-key-favorite-color="green"
></div>
```

Remake will convert this HTML into an object that has two key/value pairs: 

```javascript
{firstName: "David", favoriteColor: "green"}
```

Remake extracts the key name from the part of the attribute immediately following `data-o-key-`.

**Good to know:**

* Remake can only export strings as values
* Key names are automatically camel-cased for you
* By convention, a key that's being used as a boolean is considered `false` when it has no value. This will come into play later when we start to toggle values with checkboxes.
* There's one special type of key in Remake: `data-o-key-id`. Read more in the [Saving Data](not-available) tutorial step.

### `data-l-key-[some-key-name]`

This attribute behaves exactly like the `data-o-key-*` attribute, except its value lives somewhere else.

The value of this attribute lets you tell Remake where to look for the actual value.

The syntax for this attribute's value is: `selector property`.

The CSS `selector` argument will be used to look for an element inside the current element.

The `property` argument will be used to get the correct property from that element.

For example:

```html
<div data-o-type="object" data-l-key-img-src="img src">
  <img src="/images/beautiful.jpg">
</div>
```

Remake will use `"img"` as a CSS selector to find an element within the current element.

It will then get the `src` property of this element to use as the final value.

When it's done, the resulting data will look like this:

```javascript
{imgSrc: "/images/beautiful.jpg"} // e.g. elem.querySelector("img").src
```

**Defaults:**

* If no attribute value is provided, this attribute will default to using the `innerText` of the current element.

For example:

```html
<div data-o-type="object" data-l-key-text>Hello, world!</div>
```

Is converted into: `{text: "Hello, world!"}`.

**Good to know:**

* This attribute is useful for using data from an element's properties (e.g. `innerText`, `src`, `innerHTML`, `style`).

<h2 class="api" id="data-w">Reacting To Data Changes</h2>

### `data-w-key-[some-key-name]`

Use this attribute to react to changes in another key's value.

If the key name you use to define this attribute matches the key name of either a `data-o-key-*` or `data-l-key-*` attribute, then this attribute will be triggered when their data changes.

The value for this attribute uses the following syntax:

```javascript
customFunction1(arg1, arg2, ...) customFunction2(arg1, arg2, ...)
```

In this example, `customFunction1` and `customFunction2` would be defined when you first initialize Remake.

**Defaults:**

* If no value is provided, Remake will default to setting the `innerText` of the current element to the new value.
* If a value matching a valid HTML element property is provided (e.g. `innerText`, `src`, `innerHTML`, `style`), Remake will default to setting that attribute's value on the current element to the new value.

**Good to know:**

* In order for a watch function to be called, this attribute needs to be on or inside the data source element.
* If you have two `data-o-key-*` attributes with the same name on your page and they are nested inside of each other (**tip:** try not to do this), the watch attribute will only watch its `closest` ancestor. This makes it possible to have different levels of data on the same page.
* By convention, a this attribute should be attached to the element it's modifying.
* This attribute is very useful for displaying the same values in multiple places across a page while using the same data source.

For example, let's say you wanted to have a button on a landing page that had the same text no matter where it was displayed, you could do this:

```html
<div data-o-type="object" data-o-key-button-text="Buy Now!">
  <button data-w-key-button-text>Buy Now!</button>
  <button data-w-key-button-text>Buy Now!</button>
  <button data-w-key-button-text>Buy Now!</button>
</div>
```

With this setup, if the value of `buttonText` ever changes on the parent element, all of the buttons will get the new value inserted into their `innerText`.

<h2 class="api" id="data-i">Modifying Data</h2>

### `data-i-editable`

Add this attribute to an element if you want to make clicking on it trigger an inline edit popover.

This is the primary way of making data on a page editable. 

The syntax for the value of this attribute is: 

```javascript
someKeyName1(the-type-of-edit-field) someKeyName2(the-type-of-edit-field)
```

A `data-i-editable` attribute with this value will trigger a popover that edits two fields at once.

**Defaults:**

* If no value is provided, this attribute defaults to editing *all of the data* on the `closest` ancestor element with data.

For example:

```html
<div data-o-type="object" data-o-key-first-name="David">
    <button data-i-editable>Edit First Name</button>
</div>
```

The above will create an inline edit popover after you click on the button. Since no value is provided, it will default to editing the key `firstName` since that's the `closest` data it can find.

**Good to know:**

* Currently, only two types of edit fields are available, one for short text (`text-single-line`) and one for long text (`text-multi-line`), but in the near future there will be edit fields for images, numbers, dates, choices, toggles, etc.
* If, when a user clicks the "remove" button inside the inline edit popover, you want it to set all of the target data to empty strings (instead of removing the data source element altogether), use the alternate attribute `data-i-editable-with-hide`
* If you don't want to provide a "remove" button in the inline edit popover, use the altnernate attribute `data-i-editable-without-remove`.

---

**Note:** You only need to know about the following `data-i` attributes if you need more advanced editing capabilities beyond what the `data-i-editable` popovers provide.

### `data-i`

Use this attribute on any type of `<input>` element in order to make it able to edit data on the page.

It will find the data its supposed to edit by finding the closest ancestor element with a data key that matches the `input`'s `name` attribute.

For example:

```html
<div data-o-type="object" data-o-type-favorite-animal="">
  <input type="radio" name="favoriteAnimal" value="giraffe">
  <input type="radio" name="favoriteAnimal" value="pangolin">
  <input type="radio" name="favoriteAnimal" value="zebra">
</div>
```

**Goot to know:**

* If you want to a `data-i` attribute outside an inline edit popover and have them trigger a save every time the data changes, give the `data-i` attribute a value of `triggerSaveOnChange` (e.g. `data-i="triggerSaveOnChange"`)


### `data-i-new`

Use this attribute on any element in order to make it able to create and render new elements into the page.

It will find the element its supposed to render by looking through all your partial templates. The template is rendered server-side and then passed back to the client-side to be added to the page.

The syntax for the value of this attribute is: `templateName selector position`.

For example:

```html
<button data-i-new="todoItem .todo-list top"></button>
```

This will render the template `todoItem` and insert it at the top of the nearest `.todo-list` element.

However, this attribute defaults to adding the rendered item at the bottom of the the nearest `[data-o-type="list"]` element, so if you're okay with those defaults you only need to provide the template name.

For example:

```html
<button data-i-new="todoItem"></button>
```

**Good to know:**

* If you name an item inside of a `#forEachItem` loop, you can also use that inner template to render a new element.


### `data-i` `data-i-key` `data-i-value`

In Remake, the combination of these attributes on a single element is called a `choice`. 

Whenever an element with these 3 attributes is clicked, it sets the value of the `data-i-value` attribute on the `closest` element that matches the key in the `data-i-key` attribute.

**Note:** If you want to make your app as accessible as possible, I'd suggest using native input elements, like checkbox or radio button, instead of this option.

### `data-i-toggle`

This attribute will toggle the value of the `closest` matching key with data.

The values it will toggle between are `""` and `"true"`.

The value for this attribute is a camel-cased key name that Remake will use to match with the `closest` matching element with the same key name.


### `data-i-remove` 

When an element with this attribute is clicked, it will find the `closest` element with data and remove that element from the page.

If this attribute is attached to an element that's inside of an inline edit popover, however, it has a different behavior: when the `data-i-remove` element is clicked, Remake will first find the element that triggered the popover *and then* find the `closest` element with data and remove that element from the page.


### `data-i-hide`

When an element with this attribute is clicked, it will find the `closest` element with data and set all of its data to empty strings.

If this attribute is attached to an element that's inside of an inline edit popover, however, it has a different behavior: when the `data-i-hide` element is clicked, Remake will first find the element that triggered the popover *and then* find the `closest` element with data and set all of its data to empty strings.



<h2 class="api">Some Tips</h2>

#### CSS

You can use CSS to style the page based on a data attribute's value.

For example, lets say you wanted to implement a Dark Mode theme on your page. Your HTML might look like this:

```html
<body data-o-type="object" data-o-key-dark-mode="true">
    <button data-i-toggle="darkMode">Toggle Dark Mode</button>
</body>
```

Now, in your CSS you can style the page normally if Dark Mode is not enabled and differently if it is:

```css
body {
  background: #fff;
  color: #222;
}

body[data-o-key-dark-mode="true"] {
  background: #333;
  color: #fff;
  font-weight: 500;
}
```

<h2 class="api">Advanced Data Attributes</h2>

### `data-o-ignore`

Remake will not parse or save the data inside an element with this attribute.

### `data-o-default-[some-key-name]`

If the value of a key is going to be set to an empty string — and its key name matches this attribute's key name — Remake will replace its value with the value of this attribute.

### `data-i-click-to-save`

Clicking on an element with this attribute will trigger a save.

### `data-o-save` & `data-o-save-deep`

If you want to manually save a section of the page, you can use these custom attributes.

Reasons you might want to do this:

* You want to save a section of the page to a different endpoint
* You want to save a section of the page to a particular place in the data

These attributes allow you to specify a custom function that you can define when Remake is initialized.

For example:

```html
<div data-o-save-deep="customSaveFunction">
    <div data-o-type="object" data-o-key-some-data="hi!"></div>
</div>
```

Now, when the data on the inner element changes, your custom save function will be triggered and other save functions above it will be ignored.

**Note:** Most of the time you'll want to use `data-o-save-deep`, as it will get all the data from its child elements before passing that data to the save function, while the plain `data-o-save` will just get the data from the element its attached to.


### `data-l-target-[some-key-name]`

If you set a `data-l-key-*` attribute's value to `"target"` instead of to a selector, it will look for a `data-l-target-*` attribute that matches its key instead of for a selector.

Its a nice way of making your code explicit without having to specify long selectors.

For example: 

```html
<div data-o-type="object" data-l-key-page-title="target">
    <h1 data-l-target-page-title>Hello, world!</h1>
</div>
```

### `data-i-sync`

Used by inline edit popovers to sync data into themselves from the page and sync data back into the page after the save button has been clicked.

Useful if you're creating your own inline edit popovers.

### `data-switches`

A powerful, general-use data-attribute library for activating and deactivating single or multiple elements on the page.

Used by Remake to enable and disable the inline edit popovers, but can also be used for toggling the state of a sidebar, modal, or expandable section on the page.

### `data-copy-position` & `data-copy-dimensions` & `data-copy-layout`

A data-attribute library for copying the position and/or dimensions of one element to another. Used by Remake to position inline edit popovers.


<h2 class="api">Glossary</h2>

#### Inline Edit Popover

The areas that pop up when you click an editable item.

They allow you to edit only text for now, but will be useful for image manipulation, selecting dates, and other things in the future.

They also allow you to delete elements or remove data from the page.

They're the primary way of editing data in Remake.

#### Closest

This has an exact definition in Remake and is the basis for a lot of the code. In order to understand how Remake works, you need to understand `closest`.

Here's the exact definition from [the MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest):

> Starting with the Element itself, the closest() method traverses parents (heading toward the document root) of the Element until it finds a node that matches the provided selectorString. Will return itself or the matching ancestor. If no such element exists, it returns null.

#### Nearest

This means we start looking for the matching element at the current element, followed by looking inside the current element's parent, followed by looking in its grand parent, etc., etc. until we find a match — that's the closest element.

#### Key/value Pair

A key/value pair is a way to store data: there's a unique identifier (key) for some item of data and a value for that identifier.

#### Data Source Element

When something happens in response to data changing on a page, the element that the data is stored on is called the data source element.





