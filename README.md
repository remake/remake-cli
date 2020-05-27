# Remake
An HTML-centric and easy-to-use web app framework 

## Why Remake?
Remake allows **building sophisticated apps** while focusing on the essence of the *web*: **structured HTML**.

* **editable content** with **only HTML** templates
* **easy, intuitive and powerful syntax** for data handling
* **ideal for rapid prototyping**, as it's quick to set up

To know more about **what sets Remake apart** from other libraries, check our [Creating with Remake Guide](#todo-add-link)

## Get started
Step-by-step instructions on how to **set up a new project** with Remake. 

### 0 - Prerequisites
To use Remake, you need to install:

1. **Node.js LTS 12.16.2+**(with npm 6). Both are available in the [official node.js package](https://nodejs.org/en/)
2. **Remake CLI**, installable via terminal, with npm:
```
npm install remake -g
```

### 1 - Create a project
Use Remake CLI's **create** command to create a new Remake-powered project: 
```
remake create <project-dir>
```
### 2 - Run a development server
A newly-created Remake project has a **custom npm script** to run the development server: **dev**.
Thus, to run the development server, you can **access the project folder** (through the command line) and run: 
```
npm run dev
```
<!-- TODO: ask for the default port -->
### 3 - Learn Remake and start developing
With your project set up, you can start implementing your project, or **learn about Remake** with one of our tutorials

## Practical Guides


## Example

![Todos example app](https://remake-website.s3.amazonaws.com/todos-example.gif)

*An example of editing, adding, and removing items with the starter todos project.*


## What is Remake?

**Remake is everything you need to create a web app in record time, with very little overhead.**


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

* [A simple todo list app in 12 lines of HTML](https://docs.remaketheweb.com/a-simple-example-app/)
* [30 minute tutorial on how to build a Trello clone](https://tutorials.remaketheweb.com/)


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

Sign up for [the newsletter](https://form.remaketheweb.com/) to get updates as this framework develops


## Find out more

* [Contact the author on Twitter](https://twitter.com/panphora)
* [View the public roadmap](https://trello.com/b/BXvugSjT/remake)
* [View a live production app: RequestCreative](https://requestcreative.com)

## Contributors

* **[Andrew de Jong](https://gitlab.com/android4682)**






