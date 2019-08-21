import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import expressSession from "express-session";
const flash = require('connect-flash');
const path = require('path');
const FileStore = require('session-file-store')(expressSession);
import { initApiRoutes } from "./lib/init-api-routes";
import { initRenderedRoutes } from "./lib/init-rendered-routes";
import { initUserAccounts } from "./lib/init-user-accounts";

// set up vars
dotenv.config({ path: "variables.env" });


const app = express();


// express session
app.use(expressSession({ 
  store: new FileStore({path: path.join(__dirname, './.sessions')}),
  secret: process.env.SESSION_SECRET, 
  resave: true, 
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30
  }
}));


app.use(cookieParser());
app.use(express.static(path.join(__dirname, './dist')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(flash());


initUserAccounts({ app });
initApiRoutes({ app });
initRenderedRoutes({ app });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)

  if (process.send) {
    process.send('online');
  }
})










