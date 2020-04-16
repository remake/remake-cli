---
layout: layout.hbs
title: File Uploads - Remake Framework Docs
---

## File Uploads

Remake comes with the ability to trigger file uploads.

<div style="max-width: 480px; margin-bottom: 2rem;">
  <img src="/static/images/uploading-mockup-final.png">
</div>

All you need is an `<input type="file">` element and a few attributes.

Remake takes care of:

1. Uploading the file to a user directory
2. Showing the file's upload progress
3. Sending the file's final path back to you

<div style="max-width: 320px;">
  <img src="/static/images/file-upload-progress.png">
</div>

Then you just have one step:

1. Tell Remake where to insert the file after it's done uploading

### How to Upload Files

You get all the features listed above in just a few lines of HTML:

```html
<div data-o-type="object" data-l-key-uploaded-image>
  <input data-i type="file" name="uploadedImage">
  <img data-l-target-uploaded-image src="{{uploadedImage}}">
</div>
```

#### How this code works

1. A user clicks on the file `<input>` element
2. They choose a file to upload
3. Remake automatically shows the progress of the file upload
4. Remake returns the path of the uploaded file back to your front-end
5. Remake inserts the uploaded file's path into the closest `data-o-key-` or `data-l-key-` attribute that matches the `name` attribute on the `<input>` element
6. If the file can be displayed on the page, for example as an image or video, then it'll be displayed immediately

That's all there is to file uploads in Remake!

