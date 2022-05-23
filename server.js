const express = require("express");
const hbs = require('hbs');
const path = require('path');
const expressSession = require('express-session');
const { jiosaavnRoutes } = require("./routes/jiosaavnEndPoints");

const app = express();

// PORT
const PORT = process.env.PORT || 4000;

// Middleware
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'hbs');

app.use(express.json());
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

app.use("/", express.static(path.join(__dirname, '/public')));
hbs.registerPartials(__dirname + '/views/partials/');
app.use(expressSession({ secret: 'session_secret', saveUninitialized: false, resave: false }));


app.use("/", jiosaavnRoutes);

/**
 * Router Middleware
 * Router - /user/*
 * Method - *
 */
(async function runServer() {
    //connecting to the node server
    await app.listen(PORT);
    console.log(`Server Started at PORT ${PORT}`);
})();

