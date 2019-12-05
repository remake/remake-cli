---
layout: layout.hbs
---

## A simple todo list in Remake:

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

This is a fully-functional application, with support for:

* Adding new items to a list
* Editing the text of each item
* Removing an item
* Sharing your todo list with a friend (by sharing its url)

**Explanation:**

Line by line, this is what this code does:

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