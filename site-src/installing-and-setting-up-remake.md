---
layout: layout.hbs
---

## Installing & Setting Up Remake

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/jvBXoTKRHWY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Install Node.js

Go to the main website, download the installer, and run it.

👉 <a href="https://nodejs.org/en/">Node.js Website</a>

### Install Remake

Node comes with a command line program called `npm`, which allows you to install packages through your terminal.

Open your terminal and run this command to install Remake:

```bash
npm install remake -g
```

Once, it's done installing, you'll have access to the `remake` command in your terminal.

### Create the starter project

Remake comes with a demo project for you to play around with.

Install it by running:

```bash
remake create example-app
```

Where `example-app` is the name of the directory you want your Remake app to live in.

Then, change into that directory after it's created:

```bash
cd example-app
```

### Run the dev server

In order to use and build a Remake application on your local computer, you need to run Remake's local servier.

To get the local server started, simply run the following from your project's directory:

```bash
npm run dev
```

**Great, now you have a local Remake server running on your computer!**

### Check out the starter application!

In a web browser, go to [http://localhost:3000](http://localhost:3000) to see the Kanban starter application.

**All of the files for this app live in the `app/` directory.**

For most applications, you'll never have to edit any files that are outside of the `app/` directory.

Before moving on to the next step, make sure you sign up for a user account on your local server!

<div class="spacer--8"></div>

<a class="slanted-link" href="/attach-data-to-elements/"><span>&rarr; Next: Attach Data to Elements</span></a>
















