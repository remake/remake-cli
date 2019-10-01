---
layout: layout.hbs
---

<h1 class="logo"><img class="logo__image" src="/static/logo.svg" alt="Remake.js"></h1>

## Build <a href="/what-is-crud">CRUD</a> web apps quickly

* Feels like prototyping
* Easy-to-learn syntax
* No need to worry about the back-end

<a class="slanted-link" href="https://mailchi.mp/59def7603a0f/remake"><span>&rarr; Sign up for updates</span></a>

### Getting Started

1. Install Remake globally

```bash
npm install remake -g
```

2. Generate a starter project

```bash
remake create <project-dir>
```

3. Run the project locally

```bash
cd projectName && npm run dev
```

### Quick Start

**Creating a web application is hard.** You need to install packages, configure your build process, create API endpoints, set up a database, and load in some demo data, *and that's all before even getting started!*

**It can be easier!**

<div class="spacer--8"></div>

<a class="slanted-link" href="/not-available"><span>&rarr; Watch 15 minute tutorial</span></a>


### How Remake is Different

* Remake is server-rendered & uses Handlebars.js for templating
* Remake uses custom data attributes to attach data and behavior to HTML elements
* Remake will automatically save the data on the page for you

#### 1. Handling state is simple

Given this HTML:

```html
<div data-o-type="object" data-o-key-name="John" data-o-key-age="24"></div>
```

Remake will produce this object:

```json
{"name": "John", "age": "24"}
```

Whenever this data changes, Remake will automatically saves it to the current user's data.

#### 2. Multiple items are converted into an array

Remake uses the natural structure of this HTML:

```html
<div data-o-type="list">
  <div data-o-type="object" data-o-key-name="John" data-o-key-age="24"></div>
  <div data-o-type="object" data-o-key-name="Mary" data-o-key-age="26"></div>
</div>
```

To create an arrays of objects:

```json
[
  {"name": "John", "age": "24"},
  {"name": "Mary", "age": "26"}
]
```

Let's skip a few steps ahead to:

#### 3. A working Remake web app:

<div class="line-numbers">
{% raw %}
```html
<ul data-o-key="todos" data-o-type="list">
  {{#for todo in data.todos}}
    <li 
      data-o-type="object" 
      data-l-key-text
      data-i-editable
    >{{ todo.text }}</li>
  {{/for}}
</ul>
<button data-i-new="todo">Add Todo</button>
```
{% endraw %}
</div>

**Line by line:**

1. The data on this page will be under the key `todos` and inside an array

2. Start a `#for` loop to render all the existing todos

3. Start an `li` list item element

4. Each todo will be an object

5. The key `"text"` that this element exports will be set to the current text of this element

6. Clicking on this element will trigger an editable popover

7. Render the current todo's `text` key

8. End the `#for` loop

9. Close the `ul`

10. Click the button to render a new todo at the end of the list

### Step-By-Step Tutorial

Follow along as we create a **Choose Your Own Ending Game**!

Along the way, we'll explain what Remake is all about, how it gets its powers, and why it's the fastest way to build a web application.

<div class="spacer--8"></div>

<a class="slanted-link" href="/not-available"><span>&rarr; Start the Tutorial</span></a>

### Full Documentation

* **[Best Practices](/not-available)**
* **[Data Attributes API](/data-attributes-api)**

### Why We Made Remake

Remake allows anyone to turn a static website into a dynamic web application in a matter of minutes.

Remake's authors believe **there should be more startups in the world** — it should be easier to create them! 

The web is a relatively new technology, with a lot of room for growth. What if your neighbor could create a web app in an afternoon? That would mean you could too. Then, the web would suddenly become a less dangerous, much more interesting, and much more exciting place. 

**Our goal is to foster a more approachable and friendly internet**, so more companies and individuals can contributes to the whole ecosystem, connect, and learn from each other. 

❤️







