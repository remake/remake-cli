---
layout: layout.hbs
---

## How Saving Data Works in Remake

1. Data is always [deep extended](https://davidwalsh.name/javascript-deep-merge), so overwriting data unnecessarily is always avoided
2. If you attach the `data-o-key-id` attribute to an element (with the attribute value set to a unique id), then when that element's data is modified, it's data will be saved directly to the unique id
3. When data is deep extended, Remake always extends arrays by matching the unique ids of its child objects, so the data in arrays is preserved and never overwritten completely

#### ⭐️ More documentation coming within a few hours! 