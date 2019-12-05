---
layout: layout.hbs
---

## Sortable Items

Simply add a `data-i-sortable` attribute to any element that **contains** elements you want to sort.

Set the value of the `data-i-sortable` attribute to the group name you want to assign to the elements.

For example:

```html
<div data-i-sortable="todos">
  <div>Get milk</div>
  <div>Go to the store</div>
</div>
```

If there's another `data-i-sortable` attribute on the page with the same value, then items from each element will be able to be moved between each other!

#### ⭐️ More documentation coming within a few hours! 