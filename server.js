const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const request = require('request');
const base64 = require('base-64');
const moment = require('moment');


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

// function to calculate the balance per day
hbs.registerHelper('calculateBalance', (context, options) => {
	let bankHours = 0;
	let start = moment.utc(context, "HH:mm");
	let dailyHours = moment.utc("08:00", "HH:mm");
	
	bankHours = start.diff(dailyHours, 'minutes');

	//in case there is more than 60 mintutes converts to hours
	if (bankHours >= 60 || bankHours <= -60) {
		//format the number to two float point
		bankHours = Number.parseFloat(bankHours / 60).toFixed(2) + ' h';
	} else {
		bankHours = bankHours + 'm'; 
	}
	
	return bankHours;

});

// Method to calculate the total time of the month
hbs.registerHelper('calculateTotal', (context, options) => {
	let totalHours = 0;
	let start; 
	let dailyHours = moment.utc("08:00", "HH:mm");
	let dayOff = moment.utc("00:00", "HH:mm");

	context.forEach((item) =>{
		start = moment.utc(item.totalWorkedHours, "HH:mm"); //get the total of hours per day
		
		//avoid day off, vacation, medical leave
		if (dayOff.diff(start, 'minutes') !== 0) {
			console.log(dayOff.diff(start, 'minutes') === 0)
			totalHours += start.diff(dailyHours, 'minutes'); // checks if the balance is positive or negative by decreasing 8h per day
		}		
	})

	//in case there is more than 60 mintutes converts to hours
	if (totalHours >= 60 || totalHours <= -60) {
		//format the number to two float point
		totalHours = Number.parseFloat(totalHours / 60).toFixed(2) + ' h';
	} else {
		totalHours = totalHours + 'm'; 
	}
	return totalHours;
});

/*** Process the report--- */
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
	        	error: "Invalid credentials! Please, confirm your user and password...",
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

//redirects the user to home in case he tries to access the /report
app.get('/report', (req, res) =>{
	res.render('index.hbs');
});

//start the server
app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});