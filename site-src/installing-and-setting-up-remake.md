---
layout: layout.hbs
---

## Installing & Setting Up Remake

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/jvBXoTKRHWY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Install Node.js

Go to the main website for Node.js, download the installer, and run it.

👉 <a href="https://nodejs.org/en/">Node.js Website</a>

### Install Remake

After you're done installing Node, you'll be able to install Remake.

Node comes with a command line program called `npm`, which allows you to install packages through your terminal.

Open your terminal and run this command to install Remake globally:

```bash
npm install remake -g
```

Once it's done installing, you'll have access to the `remake` command in your terminal.

### Create the starter project

Remake comes with a working Kanban app project that you can play around with.

You can generate this starter project with the following command:

```bash
remake create example-app
```

Here, `example-app` is the name of the directory you want your new Remake app to live in.

Change into that directory after the starter app is finished being created:

```bash
cd example-app
```

### Run the dev server

In order to use and build a Remake application on your local computer, you need to run Remake's local servier.

To get the local server started, run the following command from inside your project's directory:

```bash
npm run dev
```

***Great!*** Now you have a local Remake server running on your computer!

### Check out in a browser!

In a web browser, go to [http://localhost:3000](http://localhost:3000) to see your new Kanban starter application.

**Important:** 
* All of the application files are in the `app/` directory. 
* When you're building a Remake app, you'll rarely have to edit a file that's outside the `app/` directory.

Before moving on to the next step, 
1. Load your app in a web browser 
2. Sign up for a user account in your app

<div class="spacer--8"></div>

<a class="slanted-link" href="/attach-data-to-elements/"><span>&rarr; Next: Attach Data to Elements</span></a>
















