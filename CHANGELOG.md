
# 1.5.0 (October 31, 2019)

- Added support for multi-tenant mode, which allows running multiple Remake apps inside the same Remake instance. It reads template, partials, and data on the fly and caches nothing, so apps can be changed without reloading the server.
  - To support this, we now have a `directory-helpers.js` library that fetches data and templates depending on which app you're in and takes into consideration if you're in a single-tenant instance
  - Also, we parse the url params differently depending if you're in multi-tenant mode or not
  - For a guide on how to set up a multi-tenant instance on your local machine, go here: https://www.notion.so/hellounicorns/Docs-Set-up-multi-tenant-Remake-instance-4ff53fac7a864d25bb3aaf6ddad4cf30
- Each user's details now contains the app name that the user was created in
- We parse the url parameters at a higher level (in `main.js`), so we can use them wherever we need them without having to parse them again
- Created a new asset bundler that can transpile any file that doesn't start with an underscore (before where it just worked with `main.js` and `main.sass`). The new asset bundler also supports multi-tenant builds.
- Added list of minimum supported browsers in `.babelrc`

# 1.4.0 (October 1, 2019)

- This repo no longer stores a copy of the Remake framework inside of it. When a project is created or updated, the framework code is downloaded from its GitHub repository. This means that, even if this CLI isn't up to date, it will still download the latest framework code.
  - `remake create <project-dir>` now downloads the full framework starter project from GitHub
  - `remake update-framework` now downloads the the framework code from GitHub and replaces it in the current directory

# 1.3.0 (September 27, 2019)

- the `data-i-click-to-save` attribute doesn't need a value to work
- editable popovers will be automatically suppressed if the user isn't logged in
- if you're on a route with a unique id in it, a warning will pop up if there's no data key with an id that matches it
- attributes are added to the `<body>` element to inform you the status of the app: `data-user-logged-in`, `data-user-not-logged-in`, `data-base-route`, `data-username-route`, `data-item-route`
- the full handlebars helpers library has been added
- the CLI now supports the command `remake update-framework` (however, the latest version of the CLI needs to be installed first)

# 1.2.0 (September 14, 2019)

- `data-i-new` doesn't require as many arguments now. It defaults to adding a new item to the closest `[data-o-type="list"]` element
- `data-i-editable` doesn't require any arguments now. It defaults to creating an inline edit popover for all data on the current element
- `data-o-save` is no longer required to save data. It defaults to saving data to the unique id specified in the closest `data-o-key-id` or, if none is found, it saves the entire page
- `data-i-remove` and `data-i-hide` elements can exist outside of an inline edit popover. They find the closest element with data and remove the whole element or just clear its data.
- There's now a list of reserved words that can't be used as a username (e.g. "admin")
- (framework code) Bootstrap data is now assembled into an object that's separate from the partials' data
- There's a new custom handlebars helper: `#forEachItem`. This allows you to define the name of an item inline instead of by using a partial. This makes it possible to make an app in a single template instead of being forced to use partials if you want to use the `data-i-new` attribute
- There are three other new custom handlebars helpers: `#BaseRoute`, `#UsernameRoute`, `#ItemRoute`. These allow you to easily determine the type of route you're on when rendering your page.

# 1.1.0 (August 22, 2019)

- New option for `data-i` attribute: `data-i="triggerSaveOnChange"`. Makes it so when an `<input>`'s value changes, save its data
- Replaced simple todos app in starter project with a multi todo lists app

# 1.0.0 (August 22, 2019)

- Remake is now a CLI tool for generating a starter project instead of just a starter project
- Moved Remake's front-end code inside the starter project instead of having it be a separate npm package
