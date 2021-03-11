
//**************************************************** IMPORTS **************************************************

//Requires Express Node.js framework
const express = require('express');

//Requires server encryption
const encryption = require('../Utils/CryptoServer');

//Reqires the SessionMan Utility
const sessionMan = require('../Utils/SessionMan');

//Requires the TimeUtils utility
const time = require('../Utils/TimeUtils');

//Requires passwords
const auth = require('../Utils/AuthMan');

//Requires the GeneralMongo utility
const mon = require('../Utils/GeneralMongo');

// requires email
const mailer = require('../Utils/Mailer');

// requires the URL utility
const url = require('url');

// custom logger
var log = require('../Utils/Log').clog;

//***************************************************** SETUP ***************************************************

//router to handle moving the get/post requests around
var router = express.Router();

//Export the router so that Main can access it and our GET/POST functions
module.exports = router;

//********************************************* GET / POST Requests *********************************************

//Handles the get request for the starting form of this page
router.get('/', function(req,res,next) {

    log.silly('get login');
    //Headers to try to prevent the page from being cached 
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    // helmet makes the page not render html, unless the content type is set
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    // get the parameters in the url
    // var queryObject = url.parse(req.url, true).query;
    var queryObject = req.query;

    //Get the starting form of the webpage
    getPage(queryObject.id,queryObject.u,function(err,HTML) {
        if (err) return next(err);
        //Send the HTML to the client
        res.write(HTML);
        //End our response to the client
        res.end();
    });
});

router.post('/updatePassword',function(req,res,next) {

    var encrypted = req.body.data;
    encryption.decode(encrypted, function(err,success,data) {
        if (err) return next(err);

        var userData = data.split(',');
        
                        // idhash       username
        validUser(userData[0],userData[1], function(err,valid) {
            if (err) return next(err);
            if (valid) {
                                  // username     password
                auth.updatePassword(userData[1], userData[2], function(err, done) {
                    if (err) return next(err);
                    
                    log.silly(JSON.stringify({msg:'user change user password'}));
                    res.send('/login');
                    res.end();
                });
            }
            else {
                res.send('/login');
                res.end();
            }
            
        });
    });
});


//********************************************** DEFAULT FUNCTIONS **********************************************

function getPage(idhash,username,callback) {
    encryption.getPublicKey(function(err,publickey) {
        if (err) callback(err,undefined);
        callback(undefined,Template(publickey,idhash,username));
    });
}

function Template(publickey,idhash,username) {
    var body = `
    <nav class="navbar navbar-dark bg-primary">
    <a class="navbar-brand" href="/browse" data-toggle="tooltip" data-placement="top" title="Browse book collection">Browse</a>
    <a class="navbar-brand" href="/search" data-toggle="tooltip" data-placement="top" title="Search for a book">Search</a>
    <a class="navbar-brand" href="/login" data-toggle="tooltip" data-placement="top" title="Login">Login</a>
    </nav>

    <div id="main" class="card mx-auto mt-2" style="width: 25rem;" data-publickey="${publickey}" data-userId="${idhash}" data-username="${username}">
        <div class="card-body">
            <h5 class="card-title">Enter new password</h5>
            <div class="input-group">
                <input type="password" id="password" class="form-control" placeholder="Password" data-toggle="tooltip" data-placement="top" title="Enter your new password here">
            </div>
            <div id="passerror" class="mt-2">
            
            </div>
            <br><button id="reset" class="btn w-50 mb-1 mt-2 mx-auto btn-lg btn-primary btn-block" onclick="resetPassword()" aria-expanded="false" aria-controls="details" data-toggle="tooltip" data-placement="top" title="Click to update your password">Reset Password</button>
                
        </div>
    </div>
    `;

    var jsFile = `
        <script src="sodium.js"></script>
        <script src="cryptoclient.js"></script>
        <script src="resetPassword.js"></script>
    `;
    return addHead(body,jsFile);
}

function addHead(body,jsFile) {
    var head = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>Library</title>
            

            <!-- Required meta tags -->
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

            <!-- Bootstrap CSS -->
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
            <!--<link rel="stylesheet" href="css/bootstrap.min.css"> -->
            <!--<link rel="stylesheet" href="style.css"> -->
            ${jsFile}
            <link rel="icon" href="book2.jpg">


            <meta name="author" content="SE393_Group_3">
            
        </head>
        <body>
    `;
    var tail = `
                <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
                <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js" integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI" crossorigin="anonymous"></script>
            </body>
        </html>`;
    
    return head+body+tail;

}

//*********************************************** SPECIAL FUNCTIONS *********************************************

function validUser(idhash,username,callback) {

    var collection = 'authentication';
    var attributes = ['_id', 'username'];
    var query = {
        username: username
    };
    var sort = {};

    mon.select(collection, attributes, query, sort, function(err,res) {
        if (err) return callback(err,undefined);
        
        // there should only be one result. this takes it out of the array
        var res = res[0];
        var id = res._id.toString();

        auth.verify(idhash.replace(/\*/g,','),id,function(err,valid) {
            if (err) return callback(err,undefined);
            callback(undefined,valid);
        });
    });
}