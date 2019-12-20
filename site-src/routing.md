---
layout: layout.hbs
title: Routing - Remake Framework Docs
---

### Routing basics

Currently, in order to get the `data` from a user loaded into a template, you need to be on a route like this: `/{username}/{pageName}?/{id}?`, where `username` matches a user's username.

Here, `pageName` and `id` are optional. For example, if `username` is the only param, then `pages/username.hbs` is rendered. However, if `pageName` is there, then `pages/pageName.hbs` is rendered. 

And, finally, if `id` is also provided in the route, then `pages/pageName.hbs` is rendered and the `id` is looked up in the current username's data and loaded in under a template variable called `currentItem`.

### Three routes defined by one template

A single page template in Remake, for example `pages/tasks.hbs`, will automatically defines 3 different types of routes.

These routes are:

- **/{templateName}** (e.g. `/tasks` for `tasks.hbs`)
    - This kind of route is useful for defining static pages. For example, if you want to tell your users about your web app's "tasks" feature, this would be the perfect place to put it. This type of page can display data from the current user, but no user can't modify data on this page.
- **/{username}/{templateName}** (e.g. `/john/tasks` for `tasks.hbs`)
    - This kind of route will include a user's data. If the user that matches this username happens to be logged in and viewing this page, then they can modify the data on this page. This type of page is great for loading a particular type of data and displaying it in a list or on some kind of dashboard (e.g. a list of "tasks").
- **/{username}/{templateName}/{id}** (e.g. `/john/tasks/3456` for `tasks.hbs`)
    - Everything on this type of route works the same as for the last type (i.e. `/{username}/{templateName}`), except the final param is a unique id that wants to match an item in the page author's data. Since every nested object in your data automatically gets a unique id assigned to it by Remake, this route is able to look up that data and load into the current template under a variable called `currentItem`. This route is perfect for displaying an individual item or nested list of data (e.g. a single task and its sub-tasks).

These are all the routes you'll define by creating a single template file (e.g. `/pages/tasks.hbs`). They're pretty flexible, so you don't have to worry about setting up your own routing at all!

### Two other special routes

Remake also has two other special routes that only render specific templates.

The first, is the base path of your app: **your homepage.**

Remake expects to find an `index.hbs` template in your page templates and it will render that index file whenever a user goes to your home page.

The other special route is "username" route, like `/eric` or `/kate` or `/paul`. It's the base path for a particular user — and it's the page that will be loaded right after a user signs up or logs in. 

For this case, Remake expects to find a `username.hbs` template in your page templates and it will render that file whenever a user goes to `/{username}`.


