
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

router.post('/borrowBook',function(req,res,next) {

    // helmet makes the page not render html, unless the content type is set
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl2;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 2, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'assistant borrow attempt', sess: cookie}));

            borrowBook(req.body.bookId, req.body.userId, req.body.type, function(err,success) {
                if (err) return next(err);
                
                if (success=='success') {
                    res.send('success');
                    res.end();
                }
                else if (success=='usererror') {
                    res.send('usererror');
                    res.end();
                }
                else  if (success=='bookerror'){
                    res.send('bookerror');
                    res.end();
                }
                else {
                    res.send('error');
                    res.end();
                }

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

router.post('/searchUser',function(req,res,next) {

    // helmet makes the page not render html, unless the content type is set
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl2;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 2, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            searchUser(req.body.str, function(err, resultsHTML) {
                if (err) return next(err);
                
                res.send(resultsHTML);
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

router.post('/searchBook',function(req,res,next) {

    // helmet makes the page not render html, unless the content type is set
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl2;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 2, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            searchBook(req.body.str, function(err, resultsHTML) {
                if (err) return next(err);
                
                res.send(resultsHTML);
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
    </nav>
    <div class="mt-2 text-center">
        <h3 class="pt-2 pb-2 text-center text-dark">Book Borrow</h3>
        <h5 class="pt-2 pb-2 text-center text-secondary">Search for a book</h5>
        <input type="text" class="form-control mt-2 mb-2 w-75 mx-auto bg-dark text-light" data-bookId="" data-toggle="tooltip" data-placement="top" title="Enter a search" placeholder="Title" id="searchBook">

        <div class="btn-group-vertical w-75 mx-auto text-center" role="group" aria-label="Books" id="bookSearchResults">
        </div>

        <br>
        <h5 class="pt-2 pb-2 text-center text-secondary">Search for a user</h5>
        <input type="text" class="form-control mt-2 mb-2 w-75 mx-auto bg-dark text-light" placeholder="Name" id="searchUser" data-userId="" data-toggle="tooltip" data-placement="top" title="Enter a search">

        <div class="btn-group-vertical w-75 mx-auto text-center" role="group" aria-label="Users" id="userSearchResults">
        </div>

        <div class="mx-auto text-center mt-2" id="submitwarning">
            <h4 class="text-danger"></h4>
        </div>
        
        <div class="mx-auto text-center bg-dark mt-4 w-50 rounded">
            <button class="btn btn-lg btn-primary w-100" id="submit" type="button" onclick="borrowBook();" data-toggle="tooltip" data-placement="top" title="Click to borrow a book">
            Borrow book
        </button>
        </div>
        </div>
    <br>
    `;

    var jsFile = `
        <script src="sodium.js"></script>
        <script src="cryptoclient.js"></script>
        <script src="bookborrow.js"></script>
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

function borrowBook(bookId, userId, type, callback) {
    validateUser(userId, function(err, validUser, booklist) {
        if (err) return callback(err, undefined);

        if (validUser) {
            validateBook(bookId, function(err, validBook, isShortTerm) {
                if (err) return callback(err, undefined);

                if (validBook) {
                    var numDays = (isShortTerm=='true' ? 7: 28);
                    var collection = 'bookActivity';
                    var values = {
                        bookId: ObjectId(bookId),
                        userId: ObjectId(userId),
                        type: type,
                        returned: 'false',
                        reminded: 'false',
                        date: time.getTime(),
                        duedate: time.getTime(0,0,numDays)
                    };

                    mon.insert(collection, values, function(err, activityId) {
                        if (err) return callback(err, undefined);

                        var collection = 'books';
                        var values = {
                            $push: {
                                userlist: ObjectId(activityId)
                            }
                        };
                        var query = {
                            _id : ObjectId(bookId)
                        };

                        mon.update(collection, values, query, function(err, done) {
                            if (err) return callback(err, undefined);

                            var collection = 'authentication';
                            var values = {
                                $push: {
                                    booklist: ObjectId(activityId)
                                }
                            };
                            var query = {
                                _id : ObjectId(userId)
                            };

                            mon.update(collection, values, query, function(err, done) {
                                if (err) return callback(err, undefined);


                                callback(undefined, 'success');
                            });
                        });
                    });
                }
                else {
                    return callback(undefined, 'bookerror');
                }
            });
            
        }
        else {
            return callback(undefined, 'usererror');
        }
    })
}

function validateUser(userId, callback) {
    var collection = 'authentication';
    var attributes = ['booklist','level'];
    var query = {
        _id: ObjectId(userId)
    };
    var sort = {};

    mon.select(collection,attributes,query,sort,function(err,res) {
        if (err) return callback(err, undefined, undefined);

        if (res[0].level == 1) {
            if (res[0].booklist.length < 6) {
                return callback(undefined, true, res[0].booklist);
            }
            else {
                return callback(undefined, false, undefined);
            }
        }
        else if(res[0].level == '2' || res[0].level == '3') {
            if (res[0].booklist.length < 12) {
                return callback(undefined, true, res[0].booklist);
            }
            else {
                return callback(undefined, false, undefined);
            }
        }
        else {
            return callback(undefined, false, undefined);
        }

    });
}

function validateBook(bookId, callback) {
    var collection = 'books';
    var attributes = ['info.copies', 'info.shortTerm', 'userlist'];
    var query = {
        _id : ObjectId(bookId)
    };
    var sort = {};

    mon.select(collection, attributes, query, sort, function(err, res) {
        if (err) return callback(err, undefined, undefined);

        if (res[0].info.copies > res[0].userlist.length) {
            return callback(undefined, true, res[0].info.shortTerm);
        }
        else {
            return callback(undefined, false, undefined);
        }
    });
}

function searchUser(searchString, callback) {
    var collection = 'authentication';
    var attributes = ['_id', 'info.name', 'info.ucard'];
    var searchExpression = new RegExp(searchString, 'i');
    var query = {
        $or: [
            {username: searchExpression},
            {['info.name']: searchExpression},
            {['info.ucard']: searchExpression}
        ]
    };
    var sort = {};

    mon.select(collection, attributes, query, sort, function(err, res) {
        if (err) return callback(err, undefined);

        callback(undefined, genUserSearchHTML(res));
    });
}

function genUserSearchHTML(userlist) {
    var html = '';

    for (var i = 0; i < userlist.length; i++) {
        var id = userlist[i]._id;
        var name = userlist[i].info.name;
        var ucard = userlist[i].info.ucard;

        html += `<div class="btn-group text-center" id="user-${id}" role="group">
                    <button type="button" class="btn btn-dark" id="${id}"  onclick="userSelect('${id}','${name}','${ucard}')">${name} (U-card: ${ucard})</button>
                </div>
        `;
    }
    return html;
}

function searchBook(searchString, callback) {
    var collection = 'books';
    var attributes = ['_id', 'info.title', 'info.isbn'];
    var searchExpression = new RegExp(searchString, 'i');
    var query = {
        $or: [
            {['info.title']: searchExpression},
            {['info.author']: searchExpression},
            {['info.isbn']: searchExpression}
        ]
    };
    var sort = {};

    mon.select(collection, attributes, query, sort, function(err, res) {
        if (err) return callback(err, undefined);

        callback(undefined, genBookSearchHTML(res));
    });
}

function genBookSearchHTML(booklist) {
    var html = '';

    for (var i = 0; i < booklist.length; i++) {
        var id = booklist[i]._id;
        var title = booklist[i].info.title;
        var isbn = booklist[i].info.isbn;

        html += `<div class="btn-group text-center" id="book-${id}" role="group">
                    <button type="button" class="btn btn-dark" id="${id}"  onclick="bookSelect('${id}','${title}','${isbn}')">${title} (ISBN: ${isbn})</button>
                </div>
        `;
    }
    return html;
}