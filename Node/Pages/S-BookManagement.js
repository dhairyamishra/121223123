
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
            log.silly(JSON.stringify({msg:'get book management', sess: cookie}));

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

router.post('/bookSearch', function(req,res,next) {

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'manager book search', sess: cookie}));


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
            log.silly(JSON.stringify({msg:'manager change book details', sess: cookie}));

            updateBookDetails(req.body.id, req.body.title, req.body.author, req.body.isbn, req.body.numCopies, function(err, done) {
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

router.post('/removeBook', function(req,res,next) {

    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) { 
            log.silly(JSON.stringify({msg:'manager book deletion', sess: cookie}));


            removeBook(req.body.id, function(err, done) {
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
                    <a class="navbar-brand" href="/createbook" data-toggle="tooltip" data-placement="top" title="Book Creation">Create Book</a>
                </nav>

                <div class="container" id="main" data-publicKey="${publicKey}">
                    <div class="row">
                        <div class="col-lg">
                            <h3 class="text-center">Book Management</h3>
                            <br>
                            <div class="bg-primary text-light pt-2 px-2">
                                <div class="container">
                                    <div class="row justify-content-center">
                                        <div class="col-md mb-2 pl-0 pr-2">
                                        <input type="text" class="form-control" id="searchBox" placeholder="Search string" aria-label="Search" aria-describedby="basic-addon2" data-toggle="tooltip" data-placement="top" title="Enter search string here">
                                        
                                        </div>
                                        <div class="col-xs mb-2">
                                                <select class="custom-select bg-light mr-2 w-auto" id="searchBy" data-toggle="tooltip" data-placement="top" title="Select a search type here">
                                                    <option value="none" selected>Search by...</option>
                                                    <option value="info.title">Title</option>
                                                    <option value="info.author">Author</option>
                                                    <option value="info.isbn">ISBN</option>
                                                    <option value="info.copies">Number of Copies</option>
                                                </select>                                
                                        </div>
                                        <div class="col-xs">
                                                
                                                <div class="input-group-append">
                                                    <button class="btn btn-dark" type="button" onclick="search()" data-toggle="tooltip" data-placement="top" title="Click to search for books">Search</button>
                                                </div>                                
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <br>

                            <div id="searchResults">
                                <h5 class="pt-2 pb-2 text-center text-secondary" id="helpMessage">Enter a search to show books</h5>
                            </div>
                            

                        </div>
                    </div>
                </div>`;

    var jsFile = `
        <script src="sodium.js"></script>
        <script src="cryptoclient.js"></script>
        <script src="bookmanagement.js"></script>
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

function updateBookDetails(id, title, author, isbn, numCopies, callback) {
    var collection = 'books';
    var query = {
        _id: ObjectId(id)
    };
    var values = {
        $set: {
            info: {
                title: title,
                author: author,
                isbn: isbn,
                copies: numCopies
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
    var collection = 'books';
    var attributes = ['_id','info'];
    var query = {
        [type]: new RegExp(str,'i')
    };
    
    var sort = {};

    mon.select(collection, attributes, query, sort, function(err, books) {
        if (err) return callback(err,undefined);

        return callback(undefined,genResultHTML(books));
    });
}

function genResultHTML(booklist) {
    var html = '';

    for (var i = 0; i < booklist.length; i++) {
        var book = booklist[i];

        html += `
            <div class="modal fade" id="UpdateDetailsModal-${book._id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
              <div class="modal-content">
                <div class="modal-header bg-primary">
                  <h5 class="modal-title pt-2 text-light">Update Details for ${book.info.title}</h5>
                </div>
                <div class="modal-body text-centered">
                <div class="text-centered">
                    <h6 class="pt-2 text-dark text-centered">Edit book's title</h6>
                    <input type="text" class="form-control mb-2" id="newtitle-${book._id}" placeholder="Title" aria-label="Title" aria-describedby="basic-addon2" value="${book.info.title}" data-toggle="tooltip" data-placement="top" title="Enter new title here">
                    <h6 class="pt-2 text-dark text-centered">Edit book's author</h6>
                    <input type="text" class="form-control mb-2" id="newauthor-${book._id}" placeholder="Author" aria-label="Author" aria-describedby="basic-addon2" value="${book.info.author}"data-toggle="tooltip" data-placement="top" title="Enter new author here">
                    <h6 class="pt-2 text-dark text-centered">Edit book's ISBN</h6>
                    <input type="text" class="form-control mb-2" id="newisbn-${book._id}" placeholder="ISBN" aria-label="ISBN" aria-describedby="basic-addon2" value="${book.info.isbn}"data-toggle="tooltip" data-placement="top" title="Enter new isbn here">
                    <h6 class="pt-2 text-dark text-centered">Edit books number of copies</h6>
                    <input type="text" class="form-control mb-2" id="newnumcopies-${book._id}" placeholder="Number of Copies" aria-label="Number of Copies" aria-describedby="basic-addon2" value="${book.info.copies}"data-toggle="tooltip" data-placement="top" title="Enter new number of copies here">
                
                    <button class=" btn w-auto mb-2 mx-auto btn-md btn-primary btn-block" id="submitDetails-${book._id}" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Click to edit book's details" onclick="editDetails('${book._id}')">Submit</button>
                </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Close">Close</button>
                </div>
              </div>
            </div>
          </div>
    
          <div class="modal fade" id="DeleteModal-${book._id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
              <div class="modal-header bg-danger">
                <h5 class="modal-title pt-2 text-light">Are you sure you want to delete this book? This cannot be undone.</h5>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-dismiss="modal" onclick="removeBook('${book._id}')">Yes</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
    
        <div class="bg-dark text-center rounded mb-2 p-1" id="book-${book._id}" name="book">
            <h5 class="text-center text-light">${book.info.title}</h5>
    
    
            <button class="btn w-75 mb-2 mx-auto btn-lg btn-light btn-block" data-toggle="modal" data-target="#UpdateDetailsModal-${book._id}" data-toggle="tooltip" data-placement="top" title="Click to edit book's details">Edit book's details</button>
            <button class="btn w-75 mb-2 mx-auto btn-lg btn-light btn-block" data-toggle="modal" data-target="#DeleteModal-${book._id}" data-toggle="tooltip" data-placement="top" title="Click to delete book from system">Delete book from system</button>
            
        </div>
            
            `;

    }

    return html;
}

function removeBook(id, callback) {
    var collection = 'books';
    var query = {
        _id: ObjectId(id)
    };

    // remember to delete book from user's booklist

    mon.blowup(collection, query, function(err,done) {
        if (err) return callback(err,undefined);

        var collection = 'bookActivity';
        var attributes = ['_id'];
        var query = {
            bookId : ObjectId(id)
        }
        var sort = {};

        mon.select(collection, attributes, query, sort, function(err, activityIds) {
            if (err) return callback(err, undefined);
            
            log.info(`activityIds: ${JSON.stringify(activityIds)}`);

            for (let i = 0; i < activityIds.length; i++) {
                var collection = 'authentication';
                var values = {
                    $pull : {
                        booklist: ObjectId(activityIds[i]._id)
                    }
    
                }
                var query = {
    
                }
                mon.update(collection, values, query, function(err,done) {
                    // can only callback once
                    if (i==activityIds.length-1) {
                        if (err) return callback(err, undefined);
    
                        callback(undefined, true);
                    }
                });
            }

            
        });
    });
};