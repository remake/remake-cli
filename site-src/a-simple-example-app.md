---
layout: layout.hbs
---

## A Simple, Working Todo List App:

<div class="line-numbers">
{% raw %}
```html
<div data-o-type="object">
  <ul data-o-key="todos" data-o-type="list">
    {{#for todo in todos}}
      <li 
        data-o-type="object" 
        data-l-key-text
        data-i-editable
      >{{default todo.text "New todo item"}}</li>
    {{/for}}
  </ul>
  <button data-i-new="todo">Add Todo</button>
</div>
```
{% endraw %}
</div>

<img class="image--small image--border" src="/static/todo-app.gif">

This is a fully-functional application in Remake, with support for:

* Adding new items to a list
* Editing the text of each item
* Removing an item
* Sharing your todo list with a friend (by sharing its url)
* Signing up for your own account to create your own todos

It's possible to create a fully-functional app like this, with so little code, because Remake treats each HTML element like an interactive and dynamic box of data — and not just a static element responsible for layout.

<div class="spacer--16"></div>

**Explanation:**

Line by line, this is what this code does:

1. All of the data on this page will be wrapped in an `object`

2. The list of todos will be inside of a list (i.e. `array`) under a key named `todos`

3. Render all the existing todos using a `#for` loop (when the page first loads, no todos will be rendered because none have been created yet)

4. Start an `li` list item element

5. Each todo element will represent an `object`

6. The key `"text"` that this element exports will be set to the current text of this element

7. Clicking on this todo element will trigger an editable popover

8. Render the current todo's `text` key

9. End the `#for` loop

10. Close the `ul`

11. Clicking this "Add Todo" button will render a new "todo" item at the end of the list. Remake knows what a todo template looks like based on the `#for` loop, which references "todo" in its `for ... in` statement. Remake will, by default, render this template into the nearest `data-o-type="list"`

12. Close the parent `div`




