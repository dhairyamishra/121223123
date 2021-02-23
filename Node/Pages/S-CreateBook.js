
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

// used to rename the pictures
const fs = require('fs');

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
            log.silly(JSON.stringify({msg:'get create book', sess: cookie}));

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
router.post('/createBook', function(req,res,next) {
    //This cookie is the session id stored on login page
    var cookie = req.cookies.SignInLvl3;

    //Validate the client using the session Id
    sessionMan.sessionIdValid(cookie, 3, function(err,valid) {
        if (err) return next(err);
        //If the client is valid redirect them to the appropiate page
        if(valid) {
            // create device from req.body
            createBook(req.body.title, req.body.author, req.body.isbn, req.body.numCopies, req.body.term, function(err,done) {
                if (err) return next(err);

                
                res.send(`/createbook`);
                res.end();
                log.silly(JSON.stringify({msg:'book created', sess: cookie}));
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
    callback(undefined,Template());
}

function Template() {
    var body = `<nav class="navbar navbar-dark bg-primary">
                    <a class="navbar-brand" href="/manager" data-toggle="tooltip" data-placement="top" title="Home">Home</a>
                    <a class="navbar-brand" href="/createbook" data-toggle="tooltip" data-placement="top" title="Book Creation">Create Book</a>
                    <a class="navbar-brand" href="/bookmanagement" data-toggle="tooltip" data-placement="top" title="Book Maintenance">Maintain Books</a>
                </nav>

                <div class="container">
                    <div class="row">
                        <div class="col-lg">
                            <h3 class="text-center">New Book</h3>
                            <br>
                            
                            <h5 class="pt-2 pb-2 text-center text-secondary">Book Title</h5>
                            <input type="text" class="form-control mt-2 mb-2 w-75 mx-auto bg-dark text-light" data-toggle="tooltip" data-placement="top" title="Enter the book's title" placeholder="Title" id="title">

                            <br>
                            <h5 class="pt-2 pb-2 text-center text-secondary">Book Author</h5>
                            <input type="text" class="form-control mt-2 mb-2 w-75 mx-auto bg-dark text-light" placeholder="Author" id="author" data-toggle="tooltip" data-placement="top" title="Enter the book's author">

                            <br>
                            <h5 class="pt-2 pb-2 text-center text-secondary">Book ISBN</h5>
                            <input type="text" class="form-control mt-2 mb-2 w-75 mx-auto bg-dark text-light" placeholder="ISBN" id="isbn" data-toggle="tooltip" data-placement="top" title="Enter the book's ISBN">

                            <br>
                            <h5 class="pt-2 pb-2 text-center text-secondary">Number of copies</h5>
                            <input type="text" class="form-control mt-2 mb-2 w-75 mx-auto bg-dark text-light" placeholder="Number of copies" id="numCopies" data-toggle="tooltip" data-placement="top" title="Enter the number of copies of the book">

                            <br>
                            <h5 class="pt-2 pb-2 text-center text-secondary">Short-term only?</h5>
                            <input type="checkbox" class="form-control mt-2 mb-2 w-75 mx-auto bg-dark text-light" id="shortterm" data-toggle="tooltip" data-placement="top" title="Click if book is only for short term loans">

                            <div class="mx-auto text-center bg-dark mt-4 w-50 rounded">
                                <button class="btn btn-lg btn-primary w-100" type="button" onclick="createBook();" data-toggle="tooltip" data-placement="top" title="Click to add this book">
                                    Create book
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
        <script src="createbook.js"></script>
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

function createBook(title, author, isbn, numCopies, term, callback) {

        var collection = 'books';
        var values = {
            info: {
                title: title,
                author: author,
                isbn: isbn,
                copies: numCopies,
                shortTerm: term
            },
            userlist: []
        };    
        
        mon.insert(collection, values, function(err,bookId) {
            if (err) return callback(err,undefined);
            callback(undefined,true);
        });
}