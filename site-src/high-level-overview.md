---
layout: layout.hbs
---

## A High Level Overview

#### In Remake, data is embedded directly in HTML. 

- Attributes prefixed with `data-o` or `data-l` are responsible for attaching data to HTML elements
  - The `o` in `data-o` attributes stands for "output" because this data is outputted from the page
  - The `l` in the single `data-l` attribute stands for "location" because it tells Remake to look for the data in a specific location, *not* inside the attribute's value
- Remake sees HTML elements with `data-o-type` attributes on them as representing either an `object` or an `array`. These are the two types of data structures that Remake exports from the page
- Attributes prefixed with `data-i` are responsible for changing the data on the page. 
  - The `i` stands for "input" because these attributes input data into the page, but don't output it

<img class="image--small" src="/static/data-mockup.png">

*Remake's ultimate goal is to make HTML feel like it was designed for building web apps.*

**Note:** Remake is not required (or even loaded) when a user can't edit the page. 

Remake's primary use is to make make sure the data on a dynamic page stays in sync with a backend. If the user is a viewer and not an editor, [Handlebars.js](https://handlebarsjs.com/) simply renders the page.

#### Data flow through a Remake web app

In practice, this is how data usually flows in Remake:

1. The user clicks an element with a `data-i-editable` attribute
2. A popover will appear directly on top of the clicked element, by default editing all of the data on the `closest` element with data ("closest" is highlighted here because it refers to the [Element.closest()](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) method)
3. The user edits the information inside the popover
4. The user clicks a button to save the information inside the popover
5. Data from the popover is automatically synced back into the originally clicked on element
6. All of the data on the page will be extracted as a nested object and saved to the current user's data
    - It's possible to get around this and only save the current element by attaching a unique id the page. See the [Saving](/saving/) for more info.

#### Customizing Remake with plugins

There are many low-level Remake data attributes that aren't documented thoroughly yet. A few of them are responsible for making the `data-i-editable` attribute work, under the hood, for example.

These low-level attributes can be used to create custom editable components. See [this production web app](https://requestcreative.com/), built in Remake, to see an example of what's possible when developers can build your own editable areas.

In the near future, Remake will ship with many more types of editable areas (for file uploads, image cropping, calendar input, etc.), as well as a plugin architecture that will let developers expand this further.

In the meantime, however, if you want to learn more about the low-level Remake attributes that make all of this possible, please [contact me](https://remaketheweb.com/contact-us/) and I'll send you some tutorial videos.




