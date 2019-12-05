---
layout: layout.hbs
---

## Attach Data to Elements

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/-ihDFiLa0Pc" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### A single file app!

The entire app we're building is inside of only one file: `app/username.hbs`.

If you want to start with a blank slate (with no Remake attributes on the page), like we do in the video, replace your `username.hbs` template with this one: [starter-username.hbs](https://gist.github.com/panphora/a1f39772ebc837b29173c5fb18887a8d).

Also, make sure you signed up and are logged in to an account!

### A quick note on saving

If you're following along with the video and you want your data to auto-save on page load (not a great idea in production, but fine in development), then comment out the last line in the `remake-init.js` file in `app/assets/js/remake-init.js`

### Only a few attributes to learn!

Most of the work in remake is done by just 7-8 attributes.

Here are all of the special (and powerful) custom data attributes we use in this Trello clone to add ALL of its functionality:

* data-o-type
* data-l-key-*
* data-o-key
* data-i-editable
* data-i-new
* data-i-sortable
* data-l-target-*
* data-o-default-*

To learn more about these, read the [Data Attributes API](http://localhost:8080/data-attributes-api/) page!

<div class="spacer--8"></div>

<a class="slanted-link" href="/rendering-data/"><span>&rarr; Next: Rendering Data</span></a>



#### ⭐️ More documentation coming within a few hours! 

