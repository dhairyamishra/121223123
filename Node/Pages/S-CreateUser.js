
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

// requires authentication management
const auth = require('../Utils/AuthMan');

// requires key decryption
const encryption = require('../Utils/CryptoServer');

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
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'get create user', sess: cookie}));

            getPage(function(err,HTML) {
                if (err) return next(err);
                res.write(HTML);
                res.end();
            });
        }
        //Otherwise redirect them to the timeout page
        else {
            
            log.silly(JSON.stringify({msg:'manager timeout', sess: cookie}));
            res.redirect('/login');
            res.end();
        }
    });
});

// when the client posts to create
router.post('/createUser',function(req,res,next) {
    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) {

            encryption.decode(req.body.msg, function(err,success,data) {
                if (err) return next(err);

                var userData = data.split(',');

                // create user from req.body
                auth.addAuthForLevel(userData[0],parseInt(userData[1]), userData[2], userData[3], userData[4], userData[5], userData[6], userData[7], function(err,success) {
                    if (err) return next(err);

                    if (success == 'success') {
                        log.silly(JSON.stringify({msg:'user created', sess: cookie}));
                        res.send('/manage');
                        res.end();
                    }
                    else {
                        res.send('taken');
                        res.end();
                    }
                });
            });
            
            
        }
        //Otherwise redirect them to the timeout page
        else {
            log.silly(JSON.stringify({msg:'manager timeout', sess: cookie}));
            res.send('/login');
            res.end();
        }
    });
});

//********************************************** DEFAULT FUNCTIONS **********************************************


function getPage(callback) {
    encryption.getPublicKey(function(err,publicKey) {
        if (err) return callback(err,undefined);
        callback(undefined,Template(publicKey));
    });
}

function Template(publicKey) {
    var body = `<nav class="navbar navbar-dark bg-primary">
                    <a class="navbar-brand" href="/manager" data-toggle="tooltip" data-placement="top" title="Home">Home</a>
                    <a class="navbar-brand" href="/usermanagement"  data-toggle="tooltip" data-placement="top" title="User Management">User Management</a>
                </nav>

                <div class="container" id="main" data-publicKey="${publicKey}">
                    <div class="row">
                        <div class="col-lg">
                            <h3 class="text-center">New User</h3>
                            <br>

                            <h5 class="pt-2 pb-2 text-center text-secondary">Name</h5>
                            <input type="text" class="form-control mb-2 w-75 mx-auto bg-dark text-light" placeholder="Name" id="name" data-toggle="tooltip" data-placement="top" title="Enter the new user's name">

                            <h5 class="pt-2 pb-2 text-center text-secondary">U-card</h5>
                            <input type="text" class="form-control mb-2 w-75 mx-auto bg-dark text-light" placeholder="U-card" id="ucard" data-toggle="tooltip" data-placement="top" title="Enter the new user's U-card number">

                            <h5 class="pt-2 pb-2 text-center text-secondary">Address</h5>
                            <input type="text" class="form-control mb-2 w-75 mx-auto bg-dark text-light" placeholder="Address" id="address" data-toggle="tooltip" data-placement="top" title="Enter the new user's addressr">

                            <h5 class="pt-2 pb-2 text-center text-secondary">Telephone</h5>
                            <input type="tel" class="form-control mb-2 w-75 mx-auto bg-dark text-light" pattern="[0-9]{10}" id="phone" data-toggle="tooltip" data-placement="top" title="Enter the new user's telephone number">

                            <h5 class="pt-2 pb-2 text-center text-secondary">Email</h5>
                            <input type="email" class="form-control mb-2 w-75 mx-auto bg-dark text-light" placeholder="Email" id="email" data-toggle="tooltip" data-placement="top" title="Enter the new user's email">

                            <h5 class="pt-2 pb-2 text-center text-secondary">User type</h5>
                            <div class="text-center">
                                <select class="custom-select bg-light w-auto" id="usertype" data-toggle="tooltip" data-placement="top" title="Select user's type">
                                    <option value="none" selected>Select type...</option>
                                    <option value="1">Library Member</option>
                                    <option value="2">Library Assistant</option>
                                    <option value="3">Library Manager</option>
                                </select>
                            </div>
                            
                            <div class="collapse p-2 w-75 text-center mx-auto rounded" id="authentication">
                                <h5 class="pt-2 pb-2 text-center text-secondary">Username</h5>
                                <input type="text" class="form-control mb-2 w-75 mx-auto bg-dark text-light" placeholder="Username" id="username" data-toggle="tooltip" data-placement="top" title="Enter a unique username">
                                <div class="d-none" id="usernameValid">
                                    <h4 class="text-danger">That username is taken</h4>
                                </div> 

                                <h5 class="pt-2 pb-2 text-center text-secondary">Password</h5>
                                <input type="password" class="form-control mb-2 w-75 mx-auto bg-dark text-light" placeholder="Password" id="password" data-toggle="tooltip" data-placement="top" title="Enter a password for the user">
                            </div>

                            
                            <div class="mx-auto text-center bg-dark mt-4 w-50 rounded">
                                <button class="btn btn-lg btn-primary w-100" id="submit" type="button" onclick="createUser();" data-toggle="tooltip" data-placement="top" title="Click to create the user">
                                    Create user
                                </button>
                            </div>
                            <div class="d-none" id="submitwarning">
                                <h4 class="text-danger">Make sure all fields are filled out.</h4>
                            </div>

                        </div>
                    </div>
                </div>`;

    var jsFile = `
        <script src="sodium.js"></script>
        <script src="cryptoclient.js"></script>
        <script src="createuser.js"></script>
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

// function createUser(username, pwhash, level, callback) {
//     var collection = 'authentication';
//     var values = {
//         level:level,
//         username: username,
//         hash: pwhash
//     };    
    
//     mon.insert(collection, values, function(err,issueId) {
//         if (err) return callback(err,undefined);
//         callback(undefined,shortDeviceId);
//     });
// }