# 2.6.0 (December 30, 2022)

- Allowing multiple Remake apps to run on localhost at the same time
- FIXED: randomly being logged out from a Remake app because session not destroyed
- Allow passing in sortableOptions when initializing Remake
- Update `esbuild` so it works on m1 macs 
- FIXED: Don't save twice. Removed save when syncing data into page, since setting keys saves anyways


# 2.5.8 (October 4, 2021)

- Made [main README](https://github.com/remake/remake-framework/blob/master/README.md) simpler & easier to read
- Update all NPM packages to secure versions after running `npm audit` (for both the CLI and the framework)
- Bug fixes
  - Fixed unresolved passport callbacks
  - Prevent live.js from reloading the page when new data is saved
  - Not setting NODE_ENV to "development" mode by default

# 2.5.7 (October 2, 2021)

- Update to Remake's CLI: when updating the framework, also update package.json (fields: "ava", "scripts", "nodemonConfig", "husky", "dependencies", "devDependencies"
- live reload with live.js (much better than the old way)
  - add live.js (live reload) script to Remake
  - prevent logging requests from live.js
  - remove old, slow auto-reload code
  - prevent nodemon from reload the server on html/css changes
  - make nodemon ignore entire app/ directory

# 2.4.7 (June 26, 2021)

- Update to Remake's CLI: show error for registerUser client-side if there is one

# 2.4.6 (June 10, 2021)

- If the current port is in use, make the Remake server choose a new one at random
- Add Remake's first 3 tests!
  - Make it so Remake's client-side code can run inside Node.js
- Expand the element properties (e.g. `autofocus`, `contentEditable`) that can be gotten and set from an element using Remake

# 2.4.5 (June 10, 2021)

- Provide a `{{cacheBustString}}` variable so dev can easily break CSS and JS from browser cache
  - To read more about cache busting: https://css-tricks.com/strategies-for-cache-busting-css/
- Allow `Remake.init()` to be called more than once on a page
  - Useful for the Remake client-side demo: https://codepen.io/panphora/pen/rNMVYZz
- Pass `triggerEditOnElem` to `_defaultAddItemCallback` when it's overwritten, so user can trigger the edit popover when a new item has been added to the page
- Fixed bug: Not able to import `lodash-es` or `deepdash-es`

# 2.4.1 (May 7, 2021)

- The Remake CLI will now install missing npm packages after the user updates the framework using `remake update-framework`

# 2.4.0 (May 4, 2021)

- Generate unique ids for new items automatically 🧙‍♂️
- Added an attribute argument `:edit` for the `new:` attribute (e.g. use like this: `new:example-item:edit`). It automatically triggers an edit popover when a new item is created!
- Fixed bug: Remake wasn't nesting data that's grabbed from the DOM in a consistent way
- Added Prettier and formatted all code to look nicer
- Getting DOM data with `getSaveData()` now works server-side

# 2.3.3 (January 15, 2021)

- Don't allow Remake to be initialized more than once

# 2.3.2 (November 28, 2020)

- Fixed bug on Windows causing the `remake create` command to not work ([See the fix](https://stackoverflow.com/a/16951241/87432))

# 2.3.1 (November 23, 2020)

- Added support for generating two more starter apps:
  - Resume/CV builder
  - Reading list sharer app

# 2.2.0 (November 20, 2020)

- **BIG CHANGE:** Generating unique ids for every object is now turned off by default. These ids were confusing and unhelpful to a lot of people. Remake will always support unique ids, however. Until we come up with a more elegant solution, you can turn them back on by editing your `.remake` file and adding the line: `"generateUniqueIds": true`
- Added new handlebars helper `checked` to set the `checked` attribute of a `<input type="checked">` element. You pass in a value and it generates a `checked="checked"` attribute if the value is truthy. Use it like this: `{{{checked todo.done}}}`.
- Added new `run:watch` attribute. When it's attached to an element with `watch:` attributes, those watch attributes will be triggered as soon as the page loads
- Added new `prevent-default` attribute for preventing a DOM element's default behavior
- Added `onRemoveItem()` callback
- Changed the values that the `toggle` attribute and `<input type="checkbox">` element toggle between. Now it's "true" and "false" instead of "on" and "off".
- Added some default watch functions that you can use to handle computations and set data:
  - `setMailToLink`: for setting an `href` attribute to a `mailto:` email link
  - `setLink`: for setting an `href` attribute to a valid link that has `"https://"` prepended
  - `countKeys`: counts the number of keys that match the current key, filters out any with falsey values, and uses the passed in `selector` element to update another element with this count
  - `sumKeyValues`: sums the number values of keys that match the current key and uses the passed in `selector` element to update another element with this sum
- FIX BUG: deleting all the content from a user's `user-app-data` json file won't stall the app. The data will just default to an empty object.

# 2.1.2 (November 18, 2020)

- Remake has support for custom domains! 🎉
- Added `remake custom-domain` command
- Fixed bug: `callWatchFunctionsOnElements()` wasn't working
- Fixed bug: allow `edit:` attribute to get last to args in any order
- Fixed minor issue with CLI message text
- Updated README

# 2.0.3 (November 16, 2020)

- Fix `remake-build` internal build process to use correct source mapping url for "remake.min.js" script

# 2.0.2 (November 11, 2020)

- Remove 10 unused NPM packages
- Update 2 outdated NPM packages
- Fix bug: You can now use #for loops in partial templates (oops!)
- Simplified signature of `Remake.callSaveFunction()` so you can just pass in an HTML element instead of an object

# 2.0.1 (November 8, 2020)

- Major update to README
- Multi-tenant fixes: uploading and saving data to correct directories

# 2.0.0 (November 7, 2020) 🚀

- Brand new syntax: https://recipes.remaketheweb.com/
- Brand new, much simpler directory structure
- [Read the migration guide](https://docs.google.com/document/d/1dXM7cgyg0W5M7im2RfexSsX9Gn6EfAbtY-kTp__H3A4/edit?usp=sharing)

# 1.11.2 (August 9, 2020)

- Deprecated old repositories (https://github.com/panphora/remake & https://github.com/panphora/remake-framework) and switched them to the new official "remake" organization (https://github.com/remake/remake & https://github.com/remake/remake-framework)
- Moved the documentation website outside the CLI repository (https://github.com/remake/remake-docs)

# 1.11.0 (July 6, 2020)

- Breaking change: Renamed `username.hbs` to `app-index.hbs` (so it's clearer that it's supposed to be the dynamic home page of the app)

* Added ability to include an `{{else}}` clause in a `{{for}}` loop for when there are no items to iterate over
* Small change: Made adding a layout to a page have more forgiving syntax (no longer requires spaces between braces)
* Added an empty Remake app to `/_remake/empty-project` so users can get started more quickly with their own projects
* Added better README files to every directory of both the starter Remake app and the blank Remake app 🤩

# 1.10.1 (June 24, 2020)

- Massively improved the onboarding for new users by adding README files to each directory of the Remake starter app
- Added a nice getting started message showing users where to access the app after it starts up
- Updated npm dependencies to get rid of console warnings: both `caniuse-lite` and `shelljs` were causing issues
- Breaking change: Renamed the `asset-bundler/` directory to `_remake-asset-bundler` to differentiate it from files that are modifiable by the user
- Fixed: The `remake backup` command now works for file uploads

_Important:_ If you're updating from an older version of Remake using the `remake update-framework` command, do this:

1. Run `remake update-framework`
2. Make sure all the dependencies from `https://github.com/remake/remake-framework/blob/master/package.json` are in your own `package.json`
3. Rename the `asset-bundler` directory to `_remake-asset-bundler`

You may also need to run `npm rebuild` if you get an error like `"Error: Could not locate the bindings file."`.

Sorry about this. It'll be easier to update in the future.

# 1.10.0 (April 15, 2020)

- Implemented file upload, which only requires a few lines of code to get working! (max file size 50MB by default)

```
<div data-o-type="object" data-l-key-uploaded-image>
  <input data-i type="file" name="uploadedImage">
  <img data-l-target-uploaded-image src="{{uploadedImage}}">
</div>
```

- Added a few helper file upload features:
  - Upload progress notification
  - Callbacks for file upload events
- Changed the way the `data-i` attribute works
  - By default it triggers a save unless its value is set to `dontTriggerSaveOnChange`
  - For `input[type="text"]` and `textarea` elements, the save is debounced by 800ms, so it doesn't trigger too often
- IMPROVEMENT: `data-l-key-` (i.e. location key) attributes are now smarter about how they set data. They'll set the `innerText` of most elements (as usual), but default to setting the `src` attribute on `<img>`, `<audio>`, `<video>`, `<iframe>`, and `<script>` elements, and the `href` attribute on `<link>` elements
- BUG FIX: elements with a `data-i` attribute now sets data on both `data-o-key-` and `data-l-key-` attributes and not just `data-o-key-` attributes
- Re-architected front-end Remake library, separating out data manipulation methods into `_remake/client-side/data-utilities/`. As part of this rearchitecture, we created two very useful low-level methods: `getValueFromClosestKey` and `setValueOfClosestKey`

# 1.9.0 (December 1, 2019)

- Added the `remake backup` command to backup a deployed app's data
- BUG FIX: the `/user/reset/{username}/{token}` route now works in multi-tenant mode

# 1.8.0 (November 24, 2019)

- Added a separate `remake.sass` helper styles file for:
  - hiding `data-i-new` elements
  - preserving multi-lines in multi-line editable elements
  - show a dashed border around editable elements that have no content in them
- Fix bug with `getWatchElements()` to support location keys
- Make location keys look for a target before defaulting to the `innerText` of the current element
- Allow any user to reset their password
- Add app data to the top-level of template data, so you don't have to look inside a `data` object in a template
- Fix sessions from expiring after 1 hour (now 30 days)
- Change all user account routes (e.g. `/signup`, `/login`, `/forgot`) to be prepended with `/user` and move templates
- Add a new `{{generateIdIfNone}}` Handlebars.js helper that will generate a random id for an element if it has none (this makes it possible to not create a JSON file in the `/data` directory for adding default data to new items and create the new template entirely inline on the page)
- Made the nicely-designed Kanban app as the default starter application

# 1.7.0 (November 18, 2019)

- Add support for handling deploys to a multi-tenant app
  - Uploading app assets
  - Authorizing users
  - Sub-domain registration
  - Limit deployments per user
  - New `remake deploy` command
  - New `--multitenant` flag for `remake create` command
  - Better logging and user feedback from CLI

# 1.6.0 (October 31, 2019)

- Added support for sortable items. Instructions for how to enable: https://www.notion.so/hellounicorns/Docs-Sortable-Plugin-3cdd44ece76745faa1a6e043ef0c3a76
- Fixed asset bundler bug. Changing Remake's client-side framework code (in `/_remake/client-side`) will now cause the asset bundler to recompile all the JS in `/app`. Before, it wasn't watching the code in `/_remake/client-side` at all.

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
