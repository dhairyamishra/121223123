
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

// requires authentication
const auth = require('../Utils/AuthMan');

// requires data encryption
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
            log.silly(JSON.stringify({msg:'get user management', sess: cookie}));

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

router.post('/userSearch', function(req,res,next) {

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'manager user search', sess: cookie}));


            search(req.body.searchString, req.body.searchType, function(err, HTML) {
                if (err) return next(err);

                res.send(HTML);
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

router.post('/updateDetails', function(req,res,next) {

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'manager change user password', sess: cookie}));

            var postData = req.body.msg;
            encryption.decode(postData, function(err,success,data) {
                if (err) return next(err);

                var userData = data.split(',');
                updateUserDetails(userData[0], userData[1], userData[2], userData[3], userData[4], userData[5], function(err, done) {
                    if (err) return next(err);
                    
                    res.send('done');
                    res.end();
                });
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

router.post('/updatePassword', function(req,res,next) {

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'manager change user password', sess: cookie}));

            var postData = req.body.msg;
            encryption.decode(postData, function(err,success,data) {
                if (err) return next(err);

                var userData = data.split(',');
                auth.updatePassword(userData[0], userData[1], function(err, done) {
                    if (err) return next(err);
                    
                    res.send('done');
                    res.end();
                });
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

router.post('/removeUser', function(req,res,next) {

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'manager user deletion', sess: cookie}));


            // remember to remove user from book's userlist
            auth.removeOnAuthId(req.body.id, function(err, done) {
                if (err) return next(err);

                res.send('done');
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
                    <a class="navbar-brand" href="/createuser" data-toggle="tooltip" data-placement="top" title="User Creation">Create User</a>
                </nav>

                <div class="container" id="main" data-publicKey="${publicKey}">
                    <div class="row">
                        <div class="col-lg">
                            <h3 class="text-center">User Management</h3>
                            <br>
                            <div class="bg-primary text-light pt-2 px-2">
                                <div class="container">
                                    <div class="row justify-content-center">
                                        <div class="col-md mb-2 pl-0 pr-2">
                                        <input type="text" class="form-control" id="searchBox" placeholder="Search string" aria-label="Search" aria-describedby="basic-addon2" data-toggle="tooltip" data-placement="top" title="Enter user search string here">
                                        
                                        </div>
                                        <div class="col-xs mb-2">
                                                <select class="custom-select bg-light mr-2 w-auto" id="searchBy" data-toggle="tooltip" data-placement="top" title="Select a search type here">
                                                    <option value="none" selected>Search by...</option>
                                                    <option value="username">Username</option>
                                                    <option value="level">Level</option>
                                                    <option value="info.name">Name</option>
                                                    <option value="info.ucard">U-card</option>
                                                    <option value="info.address">Address</option>
                                                    <option value="info.phone">Telephone</option>
                                                    <option value="info.email">Email</option>
                                                </select>                                
                                        </div>
                                        <div class="col-xs">
                                                
                                                <div class="input-group-append">
                                                    <button class="btn btn-dark" type="button" onclick="search()" data-toggle="tooltip" data-placement="top" title="Click to search for users">Search</button>
                                                </div>                                
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <br>

                            <div id="searchResults">
                                <h5 class="pt-2 pb-2 text-center text-secondary" id="helpMessage">Enter a search to show users</h5>
                            </div>
                            

                        </div>
                    </div>
                </div>`;

    var jsFile = `
        <script src="sodium.js"></script>
        <script src="cryptoclient.js"></script>
        <script src="usermanagement.js"></script>
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

function updateUserDetails(id, name, ucard, address, phone, email, callback) {
    var collection = 'authentication';
    var query = {
        _id: ObjectId(id)
    };
    var values = {
        $set: {
            info: {
                name:name,
                ucard:ucard,
                address:address,
                phone:phone,
                email:email
            }
        }
    };

    mon.update(collection, values, query, function(err, done) {
        if (err) return callback(err);

        callback(undefined,done);
    });
    
}

function search(str, type, callback) {
    // get all new issues
    var collection = 'authentication';
    var attributes = ['_id','username','level','info'];
    var query = {
        [type]: new RegExp(str,'i')
    };

    // this statement parses str to an int if it is one
    if (!isNaN(parseInt(str))) {
        query = {
            [type]: parseInt(str)
        }
    }
    
    var sort = {};

    mon.select(collection, attributes, query, sort, function(err, users) {
        if (err) return callback(err,undefined);

        return callback(undefined,genResultHTML(users));
    });
}

function genResultHTML(userlist) {
    var html = '';

    var userLevels = {
        1: "Library Member",
        2: "Library Assistant",
        3: "Library Manager"
    };

    for (var i = 0; i < userlist.length; i++) {
        var user = userlist[i];

        var passButton = `<button class="btn w-75 mb-2 mx-auto btn-lg btn-light btn-block" data-toggle="modal" data-target="#UpdatePasswordModal-${user._id}" data-toggle="tooltip" data-placement="top" title="Click to edit user's password">Edit user's password</button>`;

        if (user.level == 1) {
            user.username = user.info.name;
            passButton=``;
        }

        html += `
            <div class="modal fade" id="UpdateDetailsModal-${user._id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
              <div class="modal-content">
                <div class="modal-header bg-primary">
                  <h5 class="modal-title pt-2 text-light">Update Details for ${user.username}</h5>
                </div>
                <div class="modal-body text-centered">
                <div class="text-centered">
                    <h6 class="pt-2 text-dark text-centered">Edit user's name</h6>
                    <input type="text" class="form-control mb-2" id="newname-${user._id}" placeholder="Name" aria-label="Name" aria-describedby="basic-addon2" value="${user.info.name}" data-toggle="tooltip" data-placement="top" title="Enter new name here">
                    <h6 class="pt-2 text-dark text-centered">Edit user's U-card number</h6>
                    <input type="text" class="form-control mb-2" id="newucard-${user._id}" placeholder="U-card" aria-label="U-card" aria-describedby="basic-addon2" value="${user.info.ucard}"data-toggle="tooltip" data-placement="top" title="Enter new U-card number here">
                    <h6 class="pt-2 text-dark text-centered">Edit user's address</h6>
                    <input type="text" class="form-control mb-2" id="newaddress-${user._id}" placeholder="Address" aria-label="Address" aria-describedby="basic-addon2" value="${user.info.address}"data-toggle="tooltip" data-placement="top" title="Enter new address here">
                    <h6 class="pt-2 text-dark text-centered">Edit user's telephone number</h6>
                    <input type="text" class="form-control mb-2" id="newphone-${user._id}" placeholder="Telephone" aria-label="Telephone" aria-describedby="basic-addon2" value="${user.info.phone}"data-toggle="tooltip" data-placement="top" title="Enter new telephone number here">
                    <h6 class="pt-2 text-dark text-centered">Edit user's email</h6>
                    <input type="text" class="form-control mb-2" id="newemail-${user._id}" placeholder="Email" aria-label="Email" aria-describedby="basic-addon2" value="${user.info.email}"data-toggle="tooltip" data-placement="top" title="Enter new email here">
                    <button class=" btn w-auto mb-2 mx-auto btn-md btn-primary btn-block" id="submitDetails-${user._id}" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Click to edit user's details" onclick="editDetails('${user._id}')">Submit</button>
                </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Close">Close</button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal fade" id="UpdatePasswordModal-${user._id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
              <div class="modal-content">
                <div class="modal-header bg-primary">
                  <h5 class="modal-title pt-2 text-light">Update Details for ${user.username}</h5>
                </div>
                <div class="modal-body text-centered">
                <div class="text-centered">
                    <h6 class="pt-2 text-dark text-centered">Enter a new password</h6>
                    <input type="password" class="form-control mb-2" id="newpassword-${user._id}" placeholder="Password" aria-label="Password" aria-describedby="basic-addon2" data-toggle="tooltip" data-placement="top" title="Enter new password here">
                    <button class=" btn w-auto mb-2 mx-auto btn-md btn-primary btn-block" id="submitPassword-${user._id}" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Click to change user's password" onclick="editPassword('${user.username}',${user._id}')">Submit</button>
                </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Close">Close</button>
                </div>
              </div>
            </div>
          </div>
    
          <div class="modal fade" id="DeleteModal-${user._id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
              <div class="modal-header bg-danger">
                <h5 class="modal-title pt-2 text-light">Are you sure you want to delete this user? This cannot be undone.</h5>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-dismiss="modal" onclick="removeUser('${user._id}')">Yes</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
    
        <div class="bg-dark text-center rounded mb-2 p-1" id="username-${user._id}" name="user">
            <h5 class="text-center text-light">${user.username}</h5>
            <h5 class="text-center text-light">Type: ${userLevels[user.level]}</h5>
    
    
            <button class="btn w-75 mb-2 mx-auto btn-lg btn-light btn-block" data-toggle="modal" data-target="#UpdateDetailsModal-${user._id}" data-toggle="tooltip" data-placement="top" title="Click to edit user's details">Edit user's details</button>
            ${passButton}
            <button class="btn w-75 mb-2 mx-auto btn-lg btn-light btn-block" data-toggle="modal" data-target="#DeleteModal-${user._id}" data-toggle="tooltip" data-placement="top" title="Click to delete user from system">Delete user from system</button>
            
        </div>
            
            `;

    }

    return html;
}

