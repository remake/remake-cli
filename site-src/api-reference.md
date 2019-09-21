---
layout: layout.hbs
---

# Remake's API

Remake relies on data attributes for storing data and defining behavior. In fact, you can create an entire web application just using data attributes.

Let's explore what they can do!

# Attaching Data to the Page

The following attributes let you attach data to HTML elements.

### `data-o-type`

By attaching this attribute to an HTML element, you're telling Remake that there's data on (and possibly inside) that element. Remake scans the page for all elements with a `data-o-type` attribute and converts them into data.

Remake can convert an element's data into one of two data structures: either an **object** or an **array**.

To define an array, use `data-o-type="list"`.

To define an object, use `data-o-type="object"`.

These will be converted into `[]` and `{}`, respectively.

**Example of an object nested inside an array:**

```html
<div data-o-type="list">
  <div data-o-type="object"></div>
</div>
```

This is valid and will be converted into `[{}]`.


### `data-o-key="someKeyName"`

This attribute is used to nest data inside of a parent object using the provided key.

Normally, if there's an object nested in another object, they'll be merged together:

```html
<div data-o-type="object">
  <div data-o-type="object">
  </div>
</div>
```

The above objects will be merged into a single object (i.e. `{}`) because Remake doesn't know what else to do.

However, if you give the nested data a key name, it'll use that key to nest itself in its parent object.

```html
<div data-o-type="object">
  <div data-o-key="someData" data-o-type="object">
  </div>
</div>
```

Now the nested object will have a key name inside the parent object: `{someData: {}}`.

Now we know how to export structured data, but not how to attach values to elements. Let's learn that next.

### `data-o-key-[some-key-name]`

This attribute lets you attach key/value pairs to an element. 

**Important:** In order to use this attribute, you need to use the `data-o-type="object"` attribute as well.

You can attach as many key/value pairs to the same element as you want, as long as their key names are unique.

For example:

```html
<div 
  data-o-type="object" 
  data-o-key-first-name="David" 
  data-o-key-favorite-color="green"
></div>
```

Remake will convert this into an object with two key/value pairs: `{firstName: "David", favoriteColor: "green"}`.

The key is the part of the attribute after `data-o-key-` and the value is simply the attributes value. The only type of primitive value Remake knows how to export is a `String`.

You'll also notice that the key names are automatically camel-cased for you. This makes them easier to work with in JavaScript.

**Note:** In Remake, a key with an empty string as its value (e.g. `data-o-key-enable-widescreen=""`) is considered `false`. This will come into play later when we start to toggle values with checkboxes.

**Note:** Todo: mention `data-o-key-id`

### `data-l-key-[some-key-name]`

You might be wondering what this attribute is doing under the `data-o` section since it doesn't start with `data-o`.

The truth is, it's so similar to the `data-o-key-*` attribute (i.e. the previous attribute above) that it really does belong in this area.

Like the attribute directly above, it also lets you attach key/value pairs to an element. However, this time the value that's exported is **not** the value of the attribute, but rather lives somewhere else. 

(The `l` in this attribute stands for "location")

This is useful for getting and saving data that's inside an element's property (e.g. `src`, `innerHTML`, or `style`).

The syntax for this attribute's value is: `selector property`.

The selector will be used to look for a matching element inside the current element, while the property will be used to get the correct value from that element.

For example:

```html
<div data-o-type="object" data-l-key-img-src="img src">
  <img src="/images/beautiful.jpg">
</div>
```

Remake will convert this into: `{imgSrc: "/images/beautiful.jpg"}`.

However, you don't need to specify any value at all if you just want to get the `innerText` of the current element, as this is Remake's default.

For example:

```html
<div data-o-type="object" data-l-key-text>Hello, world!</div>
```

Will be automatically converted into: `{text: "Hello, world!"}`.


# Reacting To Changes in the Data

The following attributes let you watch for changes to the data and update HTML elements based on the new data.

### `data-w-key-[some-key-name]`

This attribute is used for watching other values for changes and responding to those changes.

If you create a `data-w-key-*` whose key name matches either a `data-o-key-*` or `data-l-key-*` attribute, the function that you define inside of the `data-w-key-*` attribute will be called whenever the other attributes change their values.

This is very useful for displaying the same values in multiple places across a page while using the same data source.

The syntax for this attribute's value is: 

```javascript
customFunction1(arg1, arg2, ...) customFunction2(arg1, arg2, ...)
```

You can define these custom functions when you initialize Remake.

However, most of the time, you won't need a custom function — you'll be just fine using Remake's defaults.

By default, if you provide a valid element property (e.g. `src`, `innerHTML`, or `style`) as the value for a `data-w-key-*` attribute, Remake will set the key's new value on that property.

Also, by default, if no value is provided, Remake will default to setting the `innerText` of this element. *So, you don't even need a value for this attribute most of the time!*

For example, let's say you wanted to have a button on a landing page that had the same text no matter where it was displayed, you could do this:

```html
<div data-o-type="object" data-o-key-button-text="Buy Now!">
  <button data-w-key-button-text>Buy Now!</button>
  <button data-w-key-button-text>Buy Now!</button>
  <button data-w-key-button-text>Buy Now!</button>
</div>
```

With this setup, if the value of `buttonText` ever changes on the parent element, all of the buttons will get the new value inserted into their `innerText`.

It would be the equivalent of doing this:

```html
<div data-o-type="object" data-o-key-button-text="Buy Now!">
  <button data-w-key-button-text="innerText">Buy Now!</button>
  <button data-w-key-button-text="innerText">Buy Now!</button>
  <button data-w-key-button-text="innerText">Buy Now!</button>
</div>
```

**Some important notes:**

* In order for a watch function to be called, it needs to be on or inside the element with the data it's watching.
* If you have two `data-o-key-*` attributes with the same name on your page and they are nested inside of each other (tip: try not to do this), the watch attribute will only watch its `closest` ancestor's data. This makes it possible to have different levels of data on the same page and have everything still play nicely.
* By convention, even when you define custom watch functions, you should add `data-w-key-*` attributes to the element they're going to modify. This makes your HTML easier to understand in the long run.


# Inputting Data

The following attributes let you modify the data on the page.

### `data-i-editable`

Adding this attribute to an element makes clicking on it trigger an inline edit popover.

This is the primary way of making data editable in Remake. Currently, only two types of edit fields are available, one for short text (`text-single-line`) and one for long text (`text-multi-line`), but in the near future there will be edit fields for images, numbers, dates, etc.

The syntax for the value is: 

```javascript
someKeyName1(editType) someKeyName2(editType)
```

A `data-i-editable` attribute with this value will trigger a popover that edits two fields at once.

However, most of the the time, you won't need to provide a value since this attribute defaults to editing the data on the `closest` ancestor element with data.

For example:

```html
<div data-o-type="object" data-o-key-first-name="David">
    <button data-i-editable>Edit First Name</button>
</div>
```

The above will create an inline edit popover after you click on the button. Since no value is provided, it will default to editing the key `firstName` since that's the `closest` data it can find.

Also: `data-i-editable-without-remove` and `data-i-editable-with-hide` (todo: add more details)

---

**Note:** You probably don't have to worry about the rest of the `data-i` attributes if you're just getting started. They're used heavily inside of the inline edit popovers, but since those are generated automatically when you use the `data-i-editable` attribute, you don't need to understand how they work. However, if you're building your own editable components with custom code, these will be useful.

### `data-i`

Use this attribute on any type of `<input>` element (e.g. `text`, `textarea`, `select`, `checkbox`, `radio`) so it can edit the data on the `closest` ancestor element with a matching key name.

The ancestor element will be found by matching the `name` property on the `<input>` element to the key name of a `data-o-key-*` or `data-l-key-*` attribute.

For example:

```html
todo
```


These `<input>` elements are usually inside of inline edit popovers. However, if you want to use them outside of a popover and have them trigger a save every time the data changes, give the `data-i` attribute a value of `triggerSaveOnChange`.


### `data-i-new`

This attribute allows you to create a new item and add it somewhere on the page.

The item is rendered server-side and passed back to the client-side.

The template for the new item is gotten from a template file in the `/project-files/partials` directory *or* from a named item in a `#forEachItem` loop. 

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



# Some Tips 

## CSS

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

# Remake's Advanced Data Attributes

**Note:** If you're just getting started, you probably don't need to read this section. 

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


# Glossary

## Inline Edit Popover

The areas that pop up when you click an editable item.

They allow you to edit only text for now, but will be useful for image manipulation, selecting dates, and other things in the future.

They also allow you to delete elements or remove data from the page.

They're the primary way of editing data in Remake.

## Closest

This has an exact definition in Remake and is the basis for a lot of the code. In order to understand how Remake works, you need to understand `closest`.

Here's the exact definition from [the MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest):

> Starting with the Element itself, the closest() method traverses parents (heading toward the document root) of the Element until it finds a node that matches the provided selectorString. Will return itself or the matching ancestor. If no such element exists, it returns null.

## Nearest

This means we start looking for the matching element at the current element, followed by looking inside the current element's parent, followed by looking in its grand parent, etc., etc. until we find a match — that's the closest element.

## Key/value Pair

A key/value pair is a way to store data: there's a unique identifier (key) for some item of data and a value for that identifier.








