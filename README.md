# Remake

### An easy-to-use web app framework

* **Create editable pages using only HTML templates**
* **Easy to learn, powerful data attribute syntax**
* **Perfect for rapidly prototyping ideas**

*This is an beta release*

![Todos example app](https://remake-website.s3.amazonaws.com/todos-example.gif)

The starter todos project that's generated after running `remake create`.


## Get started 

1. Install the command line tool

```
npm install remake -g
```

2. Create a new project

```
remake create <project-dir>
```

3. Run the development server

```
cd <project-dir>
npm run dev
```

4. Start building a web app with Remake!

## What is Remake?

Remake is everything you need to create a web app in record time, with very little overhead.


Remake provides all the tools you need to:

* Instantly add [CRUD operations](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) to your page
* Have all your pages' data auto-save after it's been edited
* Store your data in a format that's easy to access and understand

Out of the box, Remake comes with:

* **User accounts:** People can sign up and log in to your app!
* **Flat file database:** No need to install, configure, or host a database
* **Simple data handling:** Accessing and saving nested objects is easy

If you know how to build a website with HTML and CSS — and know the basics of [Handlebars](https://handlebarsjs.com/) templating — you can build a web app with Remake!


## Quickstart resources

* [Annotated source code for a simple todos app](https://gist.github.com/panphora/5f5657e8bb3b418d55eb68d7e17f1ed8)
* [Remake data attribute quick reference sheet](https://gist.github.com/panphora/0a71e6394d96ee9efd9d5711702bfc1c)
* [30 minute tutorial on how to build a Trello clone](https://www.youtube.com/watch?v=H_FvfswKufo)


## How does it work?

Remake is based around a simple idea: 

**What if every HTML webpage knew how to save, edit, and add new items to itself?**

* Remake uses simple data attributes, starting with `data-o` for attributes that output data and starting with `data-i` for attributes that input data
* Using a simple data attribute (`data-i-editable`), you can make the data on an element editable and have it auto-save to the database
* Using another simple data attribute (`data-i-new`), you can easily render back-end partial templates and add them to the page


## Get to know how the data works

#### Saving Data

HTML is formatted like a tree 🌳 in that it has a root node and every other element on a page branches off of that root node.

So, what if we were able to transform HTML into an **object** that we could save to a database just by looking at its natural tree structure?

We can do this in Remake by tagging elements with data. **Remake will parse and save this data automatically** whenever it changes.

Here's how it works in Remake:

```html
<div data-o-type="object"></div>
```

This element has been tagged as an `Object`, which means Remake will convert it into this:

```javascript
{}
```

Let's go through a few more examples:

##### 1. Key/value pairs

```html
<div data-o-type="object" data-o-key-name="David"></div>
```

This will be converted into an object with a key/value pair inside of it:

```javascript
{name: "David"}
```

The first attribute (`data-o-type`) tells us which data type to expect. It can be set to *only* `object` or `list`.

The second attribute (`data-o-key-name`) tells us that this `object` has a key of `name` (the key is always the part that comes after `data-o-key-`). And we look at the attribute's value to get the key's value.

##### 2. Nested data

```html
<div data-o-type="object">
  <div data-o-type="object" data-o-key="person" data-o-key-name="David">
    </div>
</div>
```

This example is a bit more advanced, as it relies on **nested** elements to create **nested** data:

```javascript
{person: {name: "David"}}
```

In this example, we use the `data-o-key` attribute — with nothing after it — to create an object inside of an object. The value of `data-o-key` tells us which key the nested object will be.

#### 3. Lists/Arrays of objects

Let's look at the only other data type that Remake supports: `Arrays`. In Remake, we use the term `list`.

How do we create a list in Remake?

```html
<div data-o-type="list"></div>
```

This is a pretty simple example and will compile into just a simple, empty array:

```
[]
```

How would we go about adding objects to this array? We'd just nest them of course!

```html
<div data-o-type="list">
  <div data-o-type="object" data-o-key-name="David">
  <div data-o-type="object" data-o-key-name="John">
  <div data-o-type="object" data-o-key-name="Mary">
</div>
```

When Remake looks at this, all it sees is:

```javascript
[
  {name: "David"},
  {name: "John"},
  {name: "Mary"}
]
```

## Stay in the loop

Sign up for [the newsletter](https://mailchi.mp/59def7603a0f/remake) to get updates as this framework develops


## Find out more

* [Contact the author on Twitter](https://twitter.com/panphora)
* [View the public roadmap](https://trello.com/b/BXvugSjT/remake)
* [View a live product app: RequestCreative](https://requestcreative.com)
