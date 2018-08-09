const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

//configures a variable because of heroku
const port = process.env.PORT || 3000;

var app = express();

var urlencodedParser = bodyParser.urlencoded({
  extended: false
});


hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'max',
  saveUninitialized: true,
  resave: false
}));

app.get('/', (req, res) =>{
	res.render('index.hbs');
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});