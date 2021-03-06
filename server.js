const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request');
const base64 = require('base-64');
const moment = require('moment');
const momentDurationFormatSetup = require("moment-duration-format");
const fixedDailyHours = moment.utc("08:00", "HH:mm");

//configures a variable to heroku environment
const port = process.env.PORT || 3000;

momentDurationFormatSetup(moment);
typeof moment.duration.fn.format === "function";
typeof moment.duration.format === "function";

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

// function to calculate the balance per day
hbs.registerHelper('calculateBalance', (context, options) => {
	let balance = 0;
	let dailyWorkedHours = moment.utc(context, "HH:mm");
	
	
	balance = dailyWorkedHours.diff(fixedDailyHours, 'minutes');

	//in case there is more than 60 mintutes converts to hours
	if (balance >= 60 || balance <= -60) {
		//format the number to two float point
		//balance = Number.parseFloat(balance / 60).toFixed(2) + ' h';
		balance = moment.duration(balance, 'minutes').format('hh:mm') + ' h';
	} else {
		balance = balance + 'm'; 
	}

	return balance;

});

// Method to calculate the total time of the month
hbs.registerHelper('calculateTotal', (context, options) => {

	let totalHours = 0;
	let workedHours; 
	let dayOff = moment.utc("00:00", "HH:mm");

	context.forEach((item) =>{
		workedHours = moment.utc(item.totalWorkedHours, "HH:mm"); //get the total of hours per day
		
		//avoid day off, vacation, all day medical leave
		if (dayOff.diff(workedHours, 'minutes') !== 0) {		
			// checks if the balance is positive or negative by decreasing 8h per day
			totalHours += workedHours.diff(fixedDailyHours, 'minutes'); 
		}		
	})

	//in case there is more than 60 mintutes converts to hours
	if (totalHours >= 60 || totalHours <= -60) {
		//format the number to two float point
		//totalHours = Number.parseFloat(totalHours / 60).toFixed(2) + ' h';
		totalHours = moment.duration(totalHours, 'minutes').format('hh:mm') + ' h';

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
	  if (res.statusCode === 200) {
	  	resp.render('index.hbs', {
	  		results: body.results,
	  		//fullfill the data in case the users wants to create another report and change only one parameter
	  		data: {
	        	username,
	        	startDate,
	        	endDate
	        }
	  	});
	  } else if (res.statusCode === 401){ //401 = invalid credentials
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