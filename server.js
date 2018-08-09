const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const request = require('request');
const base64 = require('base-64');



//configures a variable to heroku environment
const port = process.env.PORT || 3000;

//starts express
let app = express();

//parses the body parameters
let urlencodedParser = bodyParser.urlencoded({
  extended: false
});

//register the directory templates of Handlebars
hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');

//defines the 'root' directory for public files
app.use(express.static(path.join(__dirname, 'public')));

//configures the session
app.use(session({
  secret: 'max',
  saveUninitialized: true,
  resave: false
}));


/*** Receives the user login --- */
app.post('/report', urlencodedParser, (req, resp) => {
	let username = req.body.username;
	let password = req.body.password; 
	let authentication =  base64.encode(`${username}:${password}`);
	let startDate = req.body.startDate;
	let endDate = req.body.endDate;

	
	request.get( {
	    url: `https://jira.e-core.com/rest/ponto/1/batida/byCurrentUser?startDate=${startDate}&endDate=${endDate}`,
	    headers: {
    		'authorization': `Basic ${authentication}`
  		},
		json: true,
	}, (err, res, body) => {
	  // if result it's ok		
	  if (res.statusCode == 200) {
	  	resp.render('index.hbs', {
	  		results: body.results,
	  		//fullfill the data in case the users wants to create another report and change only one parameter
	  		data: {
	        	username,
	        	startDate,
	        	endDate
	        }
	  	});
	  } else if (res.statusCode == 401){ //401 = invalid credentials
		  	resp.render('index.hbs', {
	        	error: "Invalid credentials! Please, confirm your user and password",
	        	// provides the data so the user it does not have to input everything again
	        	data: {
	        		username,
	        		startDate,
	        		endDate
	        	}
      		});//end of the render
	  }
	});//end or get request
	
	
});

//renders the index page.
app.get('/', (req, res) =>{
	res.render('index.hbs');
});

//start the server
app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});