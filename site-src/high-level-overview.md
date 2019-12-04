---
layout: layout.hbs
---

## A High Level Overview

#### In Remake, data is embedded directly in HTML. 

- In Remake, `data-o`-prefixed attributes (and also the single `data-l` attribute) are responsible for attach data to HTML elements
  - Remake sees HTML all elements as representing either an `object`, with keys and values *or* an `array` that contains a list of objects
- `data-i`-prefixed attributes are responsible for changing the data in the `data-o` prefixed attributes

<img class="image--small" src="/static/data-mockup.png">

*Remake's ultimate goal is to make HTML feel like it was designed for building web apps.*

**Note:** Remake is not required (or even loaded) when a user can't edit the page. Its only use is making sure the data on the page stays in sync with the backend. Everything is rendered by [Handlebars.js](https://handlebarsjs.com/).

**In practice, this usually works like this:**

1. The user clicks an element with a `data-i-editable` attribute
2. An popover will appear that to edit the data on the `closest` element with data (`closest` is highlighted here because it refers to the `Element.closest()` method)
3. The user edits the information inside the popover
4. The user clicks a button to save the information inside the popover
5. Data from the popover is automatically synced back into the original element
6. All the data on the page will be saved (unless an element with a `data-o-key-id` is found, in which case the data will be saved to that object id)






