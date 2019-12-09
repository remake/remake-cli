---
layout: layout.hbs
---

## Rendering Data

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/Mi4cB2Hsafc" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### How to render data

After you bootstrap the data for your application, inside a JSON file in `_remake-data/user-app-data/{username}.json`, you can render it to the page using Handlebars.

Remake uses [Handlebars.js](https://handlebarsjs.com/) to render every template. All templates are server-rendered.

### Handlebars.js

Read the [official Handlebars.js documentation](https://handlebarsjs.com/) to learn more about how render data in templates.

### Extra helpers

Remake also ships with all [188 Handlebars Helpers](https://github.com/helpers/handlebars-helpers), so you can have lots of flexibility with how you render your data.

### Custom #for loop

You may have noticed that the `#for` loop we use in the tutorial video doesn't use a standard Handlebars [block helpers](https://handlebarsjs.com/guide/block-helpers.html) syntax.

We did this for two reasons:

1. We hook into this custom `#for` loop in order to make the `data-i-new` attribute work with it
2. We prefer `#for todo in todos` over something like `#for todos item="todo"` (which would've been more standard).

<div class="spacer--8"></div>

<a class="slanted-link" href="/making-data-editable/"><span>&rarr; Next: Making Data Editable</span></a>

