
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

//Requires the GeneralSQL utility
const mon = require('../Utils/GeneralMongo');

// requires email
const mailer = require('../Utils/Mailer');

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

    //Get the starting form of the webpage
    getPage(function(err,HTML) {
        if (err) return next(err);
        //Send the HTML to the client
        res.write(HTML);
        //End our response to the client
        res.end();
    });
});

router.post('/auth',function(req,res,next) {

    var encrypted = req.body.data;
    encryption.decode(encrypted, function(err,success,data) {
        if (err) return next(err);

        if (data != undefined) {
            var userData = data.split(',');
            var remember = (userData[2]=='true') ? 7: 0;
            auth.authenticate(userData[0],userData[1], function(err2,success,authId,level) {
                if (err2) return next(err2);
    
                if(success) {
                    if(level == 4) {
                        createAdminSession(level,remember,function(err3,sessionId) {
                            if (err3) return next(err3);
                            res.cookie('SignInLvl'+level,sessionId, { httpOnly: true });
                            log.silly(JSON.stringify({msg:'created level4 session',session: sessionId}));
                            res.send('/admin');
                            res.end();
                        })
                    }
                    else if(level == 3) {
                        createManagerSession(level,remember,function(err4,sessionId) {
                            if (err4) return next(err4);
                            res.cookie('SignInLvl'+level,sessionId, { httpOnly: true });
                            log.silly(JSON.stringify({msg:'created level3 session',session: sessionId}));
                            res.send('/manager');
                            res.end();
                        });
                    }
                    else if(level == 2) {
                        createAssistantSession(level,remember,function(err5,sessionId) {
                            if (err5) return next(err5);
                            res.cookie('SignInLvl'+level,sessionId, { httpOnly: true });
                            log.silly(JSON.stringify({msg:'created level2 session',session: sessionId}));
                            res.send('/assistant');
                            res.end();
                        })
                    }
                    else {
                        log.silly(JSON.stringify({msg:'unknown session creation attempt'}));
                        res.send('-1');
                        res.end();
                    }
                }
                else {
                    log.silly(JSON.stringify({msg:'invalid authentication attempt', lvl: level}));
                    res.send('-1');
                    res.end();
                }
            });
        
        }
        else {
            res.send('timeout');
            res.end();
        }
    });    
});

router.post('/forgotPassword',function(req,res,next) {
    var encrypted = req.body.data;
    encryption.decode(encrypted, function(err,success,data) {
        if (err) return next(err);

        if (data != undefined) {
            var userData = data.split(',');
        
            var url = 'https://' + req.get('host')+'/reset';
            sendForgotEmail(userData[0],url, function(err,success) {
                if (err) return next(err);
                res.send(success);
                res.end();
            });
        }
        else {
            res.send('timeout');
            res.end();
        }
        
    });
    
});


//********************************************** DEFAULT FUNCTIONS **********************************************

function getPage(callback) {
    encryption.getPublicKey(function(err,publickey) {
        if (err) callback(err,undefined);
        callback(undefined,Template(publickey));
    });
}

function Template(publickey) {
    var body = `<nav class="navbar navbar-dark bg-primary">
                    <a class="navbar-brand" href="/browse" data-toggle="tooltip" data-placement="top" title="Browse book collection">Browse</a>
                    <a class="navbar-brand" href="/search" data-toggle="tooltip" data-placement="top" title="Search for a book">Search</a>
                    <a class="navbar-brand" href="/login" data-toggle="tooltip" data-placement="top" title="Login">Login</a>
                </nav>

    <div id="main" class="card mx-auto mt-2" style="width: 25rem;" data-publickey="${publickey}">
        <div class="card-body">
            <h5 class="card-title">Log in</h5>
            <div class="input-group mb-3">
                <input type="text" id="username" class="form-control" placeholder="Username" aria-label="Username" aria-describedby="basic-addon1" data-toggle="tooltip" data-placement="top" title="Enter your username here">
            </div>
            <div class="input-group">
                <input type="password" id="password" class="form-control" placeholder="Password" data-toggle="tooltip" data-placement="top" title="Enter your password here">
            </div>
            <div id="autherror" class="mt-2">
            
            </div>
            <a href="javascript:void(0)" class="float-right" onclick="forgotPassword()" data-toggle="tooltip" data-placement="top" title="Click to reset password">Forgot password?</a>
            <br>
            <input type="checkbox" class="form-check-label" id="remember">
            <label class="form-check-label" for="remember" data-toggle="tooltip" data-placement="top" title="Saves your password for a week">Keep me logged in for 7 days</label>
            <br><button id="login" class="btn w-50 mb-1 mt-2 mx-auto btn-lg btn-primary btn-block" aria-expanded="false" aria-controls="details" data-toggle="tooltip" data-placement="top" title="Click to log in">Login</button>
                
        </div>
    </div>
    `;

    var jsFile = `
        <script src="sodium.js"></script>
        <script src="cryptoclient.js"></script>
        <script src="login.js"></script>
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

//Creates a new session and sessionData entry
function createAdminSession(level,remember,callback) {
    //Get the current time to use as the session's creation time
    var sessionTime = time.getTime(dayOffset=remember);

    //Get a new session id to use for the session
    sessionMan.getNewSessionId(level,sessionTime, function(err,sessionId) {
        if (err) return callback(err,undefined);

        // var table = 'sessionData';
        // var columns = ['sessionId','sessionDatetime'];
        // var values = [`'${sessionId}'`,`'${sessionTime}'`];

        var collection = 'sessionData';
        var data = {
            sessionId:sessionId,
            sessionDatetime:sessionTime
        };

        //Insert the session id and creation time into the database
        mon.insert(collection, data, function(err2, success) {
            if (err2) return callback(err2,undefined);
            //callback the session id so it can be sent to the client
            callback(undefined,sessionId);
        });
    });
}
//Creates a new session and sessionData entry
function createManagerSession(level,remember,callback) {
    //Get the current time to use as the session's creation time
    var sessionTime = time.getTime(0,0,remember,0,0,0);

    //Get a new session id to use for the session
    sessionMan.getNewSessionId(level,sessionTime, function(err,sessionId) {
        if (err) return callback(err,undefined);

        var collection = 'sessionData';
        var data = {
            sessionId:sessionId,
            sessionDatetime:sessionTime
        }

        //Insert the session id and creation time into the database
        mon.insert(collection, data, function(err2, success) {
            if (err2) return callback(err2,undefined);
            //callback the session id so it can be sent to the client
            callback(undefined,sessionId);
        });
    });
}

//Creates a new session and sessionData entry
function createAssistantSession(level,remember,callback) {
    //Get the current time to use as the session's creation time
    var sessionTime = time.getTime(dayOffset=remember);

    //Get a new session id to use for the session
    sessionMan.getNewSessionId(level,sessionTime, function(err, sessionId) {
        if (err) return callback(err,undefined);

        var collection = 'sessionData';
        var data = {
            sessionId:sessionId,
            sessionDatetime:sessionTime
        }

        //Insert the session id and creation time into the database
        mon.insert(collection, data, function(err2, success) {
            if (err2) return callback(err2,undefined);
            //callback the session id so it can be sent to the client
            callback(undefined,sessionId);
        });
    });
}

function sendForgotEmail(username,url, callback) {
    var collection = 'authentication';
    var attributes = ['_id', 'username','info.email'];
    var query = {
        username:username
    };
    var sort = {};

    mon.select(collection, attributes, query, sort, function(err, user) {
        if (err) return callback(err,undefined);

        // can only have one user with a username this takes it out of an array

        if (user.length == 0) return callback(undefined,false);

        user = user[0];

        auth.hash(user._id.toString(), function(err,idhash) {
            var subject = `Library System Password Reset Request`;
            var link = `${url}?id=${encodeURIComponent(idhash)}&u=${encodeURIComponent(user.username)}`;
            var body = `A password reset request was made to the Library System account associated with this email.
            If you didn't request a password change, ignore this email.
            
            To change you password, click the link below
            ${link}`;

            if (user.info.email != undefined) {
                mailer.sendEmail(user.info.email,subject,body, function(err, sent) {
                    if (err) return callback(err,undefined);
    
                    callback(undefined,true);
                });
            }
            else {
                callback(undefined,false);
            }
            
        });
    });
}