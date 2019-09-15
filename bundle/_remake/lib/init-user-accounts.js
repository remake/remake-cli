const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
const bcrypt = require('bcryptjs');
const jsonfile = require("jsonfile");
import { createUserData, getUserData } from "./user-data";
import { showConsoleError } from "../utils/console-utils";
import { capture } from "../utils/async-utils";
import { getReservedWordInfo } from "./get-reserved-word-info";

function initUserAccounts ({ app }) {
  app.use(passport.initialize());
  app.use(passport.session());

  // The local strategy require a `verify` function which receives the credentials
  passport.use(new LocalStrategy(async function(username, password, cb) {
    try {
      let [currentUser] = await capture(getUserData({ username }));

      if (!currentUser) { 
        cb(null, false);
        return;
      }

      let [passwordMatches] = await capture(bcrypt.compare(password, currentUser.details.hash));

      if (!passwordMatches) {
        cb(null, false);
        return;
      }

      cb(null, currentUser);
      return;
    } catch (err) {
      showConsoleError("Error: Passport db error", err);
    }
  }));

  passport.serializeUser(function(currentUser, cb) {
    cb(null, currentUser.details.username);
  });

  passport.deserializeUser(async function(username, cb) {
    let [currentUser] = await capture(getUserData({ username }));

    if (currentUser) {
      cb(null, currentUser);
    }
  });

  app.post('/signup', async function(req, res) {
    let username = req.body.username || "";
    let password = req.body.password || "";

    if (password.length < 8 || username.length < 1 || !validUsernameRegex.test(username)) {
      if (password.length < 8) {
        req.flash("error", "Your password must be at least 8 characters");
        res.redirect('/signup');
        return;
      }

      if (username.length < 1) {
        req.flash("error", "Please enter a username");
        res.redirect('/signup');
        return;
      }

      if (username.startsWith("_") || username.startsWith("-")) {
        req.flash("error", `Your username needs to start with a letter or number`);
        res.redirect('/signup');
        return;
      }

      if (!validUsernameRegex.test(username)) {
        req.flash("error", `Your username can only contain letters, numbers, and certain symbols ("_" or "-")`);
        res.redirect('/signup');
        return;
      }
    }

    let reservedWordInfo = getReservedWordInfo(username);
    if (reservedWordInfo.isReserved) {
      req.flash("error", `Your username can't contain the reserved word: "${reservedWordInfo.reservedWord}"`);
      res.redirect('/signup');
      return;
    }

    let [usernameTaken] = await capture(getUserData({ username }));
    if (usernameTaken) {
      req.flash("error", "That username is taken, please try another one!");
      res.redirect('/signup');
      return;
    }

    let [hash] = await capture(bcrypt.hash(password, 14));
    let [newUser] = await capture(createUserData({ username, hash }));

    req.login(newUser, function (err) {
      if (!err){
        res.redirect('/' + newUser.details.username);
      } else {
        res.redirect('/login');
      }
    });
  });

  app.post('/login', passport.authenticate('local', { 
    failureRedirect: '/login',
    failureFlash: "Invalid username or password"
  }), function(req, res) {
    res.redirect('/' + req.user.details.username);
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
  });
}

export {
  initUserAccounts
}