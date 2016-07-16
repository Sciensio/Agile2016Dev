'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.render('index', {
        appToken: process.env.SMOOCH_APP_TOKEN
    });
    res.render('loaderio-80dfee078f7b5616e36387242cb60cc4', {
        appToken: process.env.SMOOCH_APP_TOKEN
    });
});

module.exports = app;
