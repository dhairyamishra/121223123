// This is the base file for the project
// It should be as small and clean as possible
// It should only contain code necessary for setting up the server

var express = require('express'); // This project uses express for a backend framework

var app = express(); // create an instance of express


const http = require('http'); // http module is used to direct to https
const https = require('https'); // https module is used to secure traffic
const fs = require('fs'); // module to read from and write to file
const mon = require('./Utils/GeneralMongo'); // module to make database access cleaner
const encryption = require('./Utils/CryptoServer'); // module to handle server encryption
const bodyParser = require('body-parser'); // parses ajax body
const cookieParser = require('cookie-parser'); // allows the use of cookies to track sessions
var log = require('./Utils/Log').clog;

const winston = require('winston'); // module for detailed logging
    const expressWinston = require('express-winston'); // module for easy logging in express
    require('winston-daily-rotate-file'); // module to rotate log files easily


app.use(cookieParser());

app.use(bodyParser.urlencoded({ // lets the body parser get data from the url
    extended: true
}));

app.use(bodyParser.json()); // lets the body parser handle json

app.use(express.static('../Public')); // makes all the files in the public folder accessible to clients

// this block redirects http to https
app.use(function(req,res,next) {
    if(!req.secure) {
        return res.redirect(['https://', req.headers.host, req.url].join(''));
    }
    next();
});

// import pages
var Landing = require('./Pages/S-Landing');
var Login = require('./Pages/S-Login');
var Manager = require('./Pages/S-LibraryManager');
var CreateBook = require('./Pages/S-CreateBook');
var CreateUser = require('./Pages/S-CreateUser');
var UserManagement = require('./Pages/S-UserManagement');
var BookManagement = require('./Pages/S-BookManagement');
var Assistant = require('./Pages/S-LibraryAssistant');
var Borrow = require('./Pages/S-BookBorrow');

var NotFound = require('./Pages/S-NotFound');
var PageError = require('./Pages/S-Error');


app.use('/landing', Landing);
app.use('/login', Login);
app.use('/manager', Manager);
app.use('/createbook', CreateBook);
app.use('/createuser', CreateUser);
app.use('/usermanagement', UserManagement);
app.use('/bookmanagement', BookManagement);
app.use('/assistant', Assistant);
app.use('/borrow', Borrow);

app.use('/404', NotFound);
app.use('/error', PageError);

// redirect from base page to /landing page
app.get('/', function(req,res) {
    res.redirect('/landing');
});

app.get('*', function(req,res) {
    res.redirect('/404');
});

app.use(function (err,req,res,next) {
    res.status(500).redirect('/error');

    // pass the error 'up the chain'
    next(err);
});

// server initialization
function init() {
    // get the data from setup.json
    fs.readFile('../bin/setup.json', function(err,content) {
        // if the file can't be read, print error to console
        if (err) return console.log('Error loading setup file:\n' + err);

        // convert the file contents into json format
        var setup = JSON.parse(content);

        // don't think this is necessary anymore
        var days = setup.log_folder_lifetime_days; // formats the lifetime from the setup folder
        if (days == '0d') days = null; // if the lifetime is 0 days, never delete files

        // adds the error logger
        app.use(expressWinston.errorLogger({
            transports: [
                new winston.transports.Console(),
                new winston.transports.DailyRotateFile({
                    level: 'error',
                    filename: setup.log_folder + 'error-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxFile: days,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            ]
        }));

        // gets the https key and cert from the file defined in setup.json
        const httpsAuth = {
            key: fs.readFileSync(setup.key_path),
            cert: fs.readFileSync(setup.cert_path)
        };

        const connectionUrl = fs.readFileSync(setup.mongo_url_path).toString();
        // initialize connection to database
        mon.init(connectionUrl, function(err,done) {
            if (err) log.error(err);
            // initialize encryption
            encryption.init(function(err2,done) {
                if (err2) log.error(err2);
                // create http server on port defined in setup. json
                https.createServer(httpsAuth,app).listen(setup.secure_server_port, function() {
                    // create http server ** Only used to redirect client to secure server
                    http.createServer(app,function(req,res) {
                        // immediately redirect client to secure server
                        res.writeHead(307, { "Location": "https://" + req.headers['host'] + req.url});
                        res.end();
                    }).listen(setup.insecure_server_port, function() { // the http server is on the port defined in setup.json
                        // If the server is setup correctly, print to console
                        log.info(`SE Library System listening on port ${setup.secure_server_port}`);
                    });
                });
            });
        });
        


    });

}

init();