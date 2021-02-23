
//**************************************************** IMPORTS **************************************************

//Reqires the SessionMan Utility
const sessionMan = require('../Utils/SessionMan');

//Requires the GeneralSQL utility.
const mon = require("../Utils/GeneralMongo");

//Requires Express Node.js framework
const express = require('express');

//Requires the TimeUtils utility
const time = require('../Utils/TimeUtils');

// requires converting string ids to objectids
const {ObjectId} = require('mongodb');

// custom logger
var log = require('../Utils/Log').clog;

//***************************************************** SETUP ***************************************************

//router to handle moving the get/post requests around
var router = express.Router();

//Export the router so that Main can access it and our GET/POST functions
module.exports = router;

//********************************************* GET / POST Requests *********************************************

//Handles the get request for the starting form of this page
router.get('/',function(req,res,next) {

    // helmet makes the page not render html, unless the content type is set
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl2;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 2, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'get assistant', sess: cookie}));

            // home
            getPage(function(err,HTML) {
                if (err) return next(err);
                res.write(HTML);
                res.end();
            });
            
        }
        //Otherwise redirect them to the timeout page
        else {
            
            log.silly(JSON.stringify({msg:'assistant timeout', sess: cookie}));
            res.redirect('/login');
            res.end();
        }
    });
});

router.post('/logout',function(req,res,next) {

    // helmet makes the page not render html, unless the content type is set
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl2;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 2, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'assistant logout', sess: cookie}));

            sessionMan.removeSessionId(cookie,function(err,done) {
                if (err) return next(err);
                
                res.send('/login');
                res.end();
            });
            
        }
        //Otherwise redirect them to the timeout page
        else {
            
            log.silly(JSON.stringify({msg:'assistant timeout', sess: cookie}));
            res.redirect('/login');
            res.end();
        }
    });
});
//********************************************** DEFAULT FUNCTIONS **********************************************

function getPage(callback) {
    callback(undefined,Template());
}

function Template() {
    var body = `
    <nav class="navbar navbar-dark bg-primary">
        <a class="navbar-brand" href="/assistant" data-toggle="tooltip" data-placement="top" title="Home">Home</a>
        <a class="navbar-brand" href="/borrow" data-toggle="tooltip" data-placement="top" title="Book Borrow">Borrow</a>
        <a class="navbar-brand" href="/return" data-toggle="tooltip" data-placement="top" title="Book Return">Return</a>
        <a class="navbar-brand" href="/login" onclick="logout()" data-toggle="tooltip" data-placement="top" title="Log out of system">Log out</a>
    </nav>
    <div class="mt-2">
        <h3 class="text-center">Logged in as a Library Assistant</h3>
    </div>
    <br>
    <a class="btn btn-lg w-75 mb-2 mt-2 mx-auto btn btn-primary btn-block" href="/borrow" data-toggle="tooltip" data-placement="top" title="Click to go to book creation">Book borrow</a>
    <a class="btn btn-lg w-75 mb-2 mt-2 mx-auto btn btn-primary btn-block" href="/return" data-toggle="tooltip" data-placement="top" title="Click to go to device maintenance">Book return</a>
    `;

    var jsFile = `
        <script src="sodium.js"></script>
        <script src="cryptoclient.js"></script>
        <script src="assistant.js"></script>
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
