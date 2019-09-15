# 1.2.0

- `data-i-new` doesn't require as many arguments now. It defaults to adding a new item to the closest `[data-o-type="list"]` element
- `data-i-editable` doesn't require any arguments now. It defaults to creating an inline edit popover for all data on the current element
- `data-o-save` is no longer required to save data. It defaults to saving data to the unique id specified in the closest `data-o-key-id` or, if none is found, it saves the entire page
- `data-i-remove` and `data-i-hide` elements can exist outside of an inline edit popover. They find the closest element with data and remove the whole element or just clear its data.
- There's now a list of reserved words that can't be used as a username (e.g. "admin")
- (framework code) Bootstrap data is now assembled into an object that's separate from the partials' data
- There's a new custom handlebars helper: `#forEachItem`. This allows you to define the name of an item inline instead of by using a partial. This makes it possible to make an app in a single template instead of being forced to use partials if you want to use the `data-i-new` attribute
- There are three other new custom handlebars helpers: `#BaseRoute`, `#UsernameRoute`, `#ItemRoute`. These allow you to easily determine the type of route you're on when rendering your page.

# 1.1.0

- New option for `data-i` attribute: `data-i="triggerSaveOnChange"`. Makes it so when an `<input>`'s value changes, save its data
- Replaced simple todos app in starter project with a multi todo lists app

# 1.0.0

- Remake is now a CLI tool for generating a starter project instead of just a starter project
- Moved Remake's front-end code inside the starter project instead of having it be a separate npm package