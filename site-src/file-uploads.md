---
layout: layout.hbs
title: File Uploads - Remake Framework Docs
meta:
  <meta name="description" content="Upload files instantly with a few lines of HTML">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="File Uploads in Remake">
  <meta name="twitter:description" content="Upload files instantly with a few lines of HTML using Remake">
  <meta name="twitter:site" content="@remaketheweb">
  <meta name="twitter:creator" content="@panphora">
  <meta name="twitter:image" content="https://docs.remaketheweb.com/static/og/og-twitter-uploading-mockup.png?v=1">
  <meta name="og:title" content="File Uploads in Remake">
  <meta name="og:description" content="Upload files instantly with a few lines of HTML">
  <meta name="og:image" content="https://docs.remaketheweb.com/static/og/og-main-uploading-mockup.png">
  <meta name="og:url" content="https://docs.remaketheweb.com/file-uploads/">
---


## File Uploads

<div style="max-width: 520px; margin-bottom: 2rem;">
  <img src="/static/images/uploading-mockup-final.png">
</div>

Remake can trigger a file upload using a single line of HTML.

```html
<input data-i type="file">
```

To display the file after it's uploaded, you just need to add a couple more lines:

```html
<div data-o-type="object" data-l-key-uploaded-image>
  <input data-i type="file" name="uploadedImage">
  <img data-l-target-uploaded-image src="{{uploadedImage}}">
</div>
```

**Remake takes care of:**

<div class="side-by-side">
  <div class="three-fifths">
    <ol>
      <li>Uploading the file to a user directory</li>
      <li>Showing the file's upload progress</li>
      <li>Sending the file's final path back to you</li>
    </ol>
  </div>
  <div class="two-fifths">
    <img src="/static/images/file-upload-progress.png">
  </div>
</div>

**You just have to do two steps:**

1. Create the file `<input>` element
1. Tell Remake where to insert the file after it's done uploading

<div class="spacer--8"></div>

**That's it! 🎉**

### How file uploading works

With a minimal amount of code, you get:

1. File uploading
2. A progress bar notification
3. The file is inserted into the page
4. All your data is saved

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
5. Remake will insert the path of the uploaded file into the closest `data-o-key-*` or `data-l-key-*` attribute, as long as it matches the `name` attribute that's on the `<input>` element 
6. If the file can be displayed on the page, for example as an image or video, then it'll be displayed immediately

That's all there is to file uploads in Remake! 🌈

