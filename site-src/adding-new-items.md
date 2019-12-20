---
layout: layout.hbs
title: Adding New Items - Remake Framework Docs
---

## Adding New Items

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/QwAvNr6brqU" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Rendering new items

Remake is different from most frameworks in that it mixes the state of your web app with the presentation.

This makes a lot of things easier — including styling the page based on the state of your data.

Another thing it makes easier is adding new items. Because Remake understands where your "Add" button is, it can make a smart guess about which list you want to add your item into.

So, usually a simple `data-i-new` attribute with a value set to a template name (or an item referenced in a #for loop) is enough to render and add a new item to the page.

<div class="spacer--8"></div>

<a class="slanted-link" href="/sorting-lists-of-items/"><span>&rarr; Sorting Lists of Items</span></a>
