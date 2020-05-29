# Remake
An HTML-centric and easy-to-use web app framework 

## Why Remake?
With Remake, you can **build sophisticated apps** while focusing on the core of the *web*: **structured HTML**. It does so by:

* allowing creation of **editable content with just HTML**
* providing an **easy, intuitive and powerful syntax** for data handling
* being **quick to set up**, making an ideal option for **prototyping** and **rapid development** 

To know more about **what sets Remake apart** from other libraries, check our [Creating with Remake Guide](#todo-add-link). 

You can also **see Remake in action** at [RequestCreative, our live demo](https://requestcreative.com). 

## Get started
Step-by-step instructions on how to **set up a new project** with Remake. 

### 0 - Install prerequisites
To use Remake, you need to install:

1. **Node.js LTS 12.16.2+**(with npm 6). Both are available in the [official node.js package](https://nodejs.org/en/)
2. **Remake CLI**, installable via terminal, with npm:
```
npm install remake -g
```

### 1 - Create project
Use Remake CLI's **create** command to create a new Remake-powered project: 
```
remake create <project-dir>
```
### 2 - Run project server
Any newly-created Remake project provides a **custom script** (*dev*) to run the project through a **development server**.

To run the development server, you can **access the project folder** through the command line and run: 
```
npm run dev
```
<!-- TODO: ask for the default port -->
### 3 - Learn Remake and start developing
With your project set up, you're ready to either **implement** your project or [**learn how to use Remake**](#learn-about-remake).

## Learn about Remake
There are many ways to learn a subject, some more practical, and some more in-depth. So we suggest:

- (**guided examples**)[#guided-examples], to learn the basics of Remake with practical scenarios
- (**in-depth concept explanation**)[#remake-in-depth], to understand more advanced concepts and build larger projects 

### Guided examples
One of the best ways to teach is by example. 
These tutorials are **beginner-friendly introductions** to Remake's API, highlighting its key features in practical ways:

* [Build a todo list in 12 lines of HTML](https://docs.remaketheweb.com/a-simple-example-app/)
* [Build a Trello clone in 30 minutes](https://tutorials.remaketheweb.com/)

<!-- TODO: love this content, but I suggest we move it to a separate file, as it's an in-depth guide by itself -->
### Remake in-depth
> What if every HTML webpage knew how to save, edit, and add new items by itself?

Remake's mission is to allow creating *web* apps **in record time** and with **minimum overhead**. We believe that anyone proficient in HTML and CSS (and some templating engine, like Handlebars) should be able to **create apps with data management features** instantly, but without the need for back-end or tech-specific knowledge.

And this is why Remake comes built-in with:

- [**CRUD operations**](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete), with no additional library needed
- **automatic data saving** after editing content
- a **flat file database** that doesn't require custom configuration, to make it easier to use and understand
- **user accounts** People can sign up and log in to your app!
- **a simple API to handle data** that faciitates accessing and saving nested objects

#### The Remake API and Data Attributes

Remake's API is centered around **data attributes** that **tag data to HTML elements**.
And to make it as intuitive as possible, we defined a limited set of rules for API-specific data attributes:
  
- use specific prefixes in data attribues to set data as **input data** (`data-i`) or **output data** (`data-o`)
  - Ex.:<!-- TODO: add example -->
- use `data-i-editable` in an element to allow **editing and automatic saving** of its data
<!-- TODO: I don't really get this one, maybe we could rephrase it -->
- use `data-i-new` to render back-end partial templates and add them to the page

##### How Remake (actually) handles data

HTML is formatted like a tree 🌳: it has a root (the parent element) and children linked to it (child elements). 

<!-- TODO: we could make a simple diagram to examplify, with "page" at the bottom and html elements on top", inheriting from each other -->

And with Remake, we apply this branching model to **objects** tagged to HTML elements, as well. It's by looking at an element's position in the page's "tree-like structure" that **Remake determines what to save** automatically.

Here's an example:

```html
<div data-o-type="object"></div>
```

This element has been tagged as an `Object`, which means Remake will convert it into this:

```javascript
{}
```

This is a basic object. Let's go through a few more examples, on the next chapter.

##### Example 1 - Key/value pairs

```html
<div data-o-type="object" data-o-key-name="David"></div>
```

This will be converted into an object with a key/value pair inside of it:

```javascript
{name: "David"}
```

The first attribute (`data-o-type`) tells us which data type to expect. It can be set to *only* `object` or `list`.

The second attribute (`data-o-key-name`) tells us that this `object` has a key of `name` (the key is always the part that comes after `data-o-key-`). And we look at the attribute's value to get the key's value.

##### Example 2 - Nested data

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

#### Example 3 - Lists/Arrays of objects

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

## Contributions

We have to thank these fellows for all their help in (Re)making this project:

- **[Andrew de Jong](https://gitlab.com/android4682)**

### How to contribute

If you'd like to join our contributors -- and we'd love to have you! -- there are many ways you can help with our project:

- fixing bugs
- suggesting or implementing features
- updating documentation
- cleaning up code (useless comments, etc.)

<!-- TODO: add link to issue list -->
So feel free [to create an issue](), and we'll provide you feedback as soon as possible!

## Stay in the loop

Sign up for [our newsletter](https://form.remaketheweb.com/) to get updates as this framework develops. 

Additionally, feel free to: 

* [follow panphora (Remake's creator) on Twitter](https://twitter.com/panphora)
* [View Remake's public roadmap on Trello](https://trello.com/b/BXvugSjT/remake)







