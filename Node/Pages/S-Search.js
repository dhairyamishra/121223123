
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
        getPage(function(err,HTML) {
            if (err) return next(err);
            res.write(HTML);
            res.end();
        });
});

router.post('/bookSearch', function(req,res,next) {
    search(req.body.searchString, req.body.searchType, req.body.sortType, function(err, HTML) {
        if (err) return next(err);

        res.send(HTML);
        res.end();
    });
});

//********************************************** DEFAULT FUNCTIONS **********************************************

function getPage(callback) {
    callback(undefined,Template());
}

function Template() {
    var body = `<nav class="navbar navbar-dark bg-primary">
                    <a class="navbar-brand" href="/browse" data-toggle="tooltip" data-placement="top" title="Browse book collection">Browse</a>
                    <a class="navbar-brand" href="/search" data-toggle="tooltip" data-placement="top" title="Search for a book">Search</a>
                    <a class="navbar-brand" href="/login" data-toggle="tooltip" data-placement="top" title="Login">Login</a>
                </nav>

                <div class="container" id="main">
                    <div class="row">
                        <div class="col-lg">
                            <h3 class="text-center">Book Search</h3>
                            <br>
                            <div class="bg-primary text-light pt-2 px-2">
                                <div class="container">
                                    <div class="row justify-content-center">
                                        <div class="col-md mb-2 pl-0 pr-2">
                                        <input type="text" class="form-control" id="searchBox" placeholder="Search string" aria-label="Search" aria-describedby="basic-addon2" data-toggle="tooltip" data-placement="top" title="Enter search string here">
                                        
                                        </div>
                                        <div class="col-xs mb-2">
                                                <select class="custom-select bg-light mr-2 w-auto" id="searchBy" data-toggle="tooltip" data-placement="top" title="Select a search type here">
                                                    <option value="info.title" selected>Title</option>
                                                    <option value="info.author">Author</option>
                                                    <option value="info.isbn">ISBN</option>
                                                </select>                                
                                        </div>
                                        <div class="col-xs mb-2">
                                            <select class="custom-select bg-light mr-2 w-auto" id="sortBy" data-toggle="tooltip" data-placement="top" title="Select a sort type here">
                                                <option value="1" selected>Ascending</option>
                                                <option value="-1">Descending</option>
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
        <script src="search.js"></script>
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

function search(str, type, sortType, callback) {
    // get all new issues
    var collection = 'books';
    var attributes = ['_id','info'];
    var query = {
        [type]: new RegExp(str,'i')
    };
    
    var sort = {
        [type]:parseInt(sortType)
    };

    mon.select(collection, attributes, query, sort, function(err, books) {
        if (err) return callback(err,undefined);

        return callback(undefined,genResultHTML(books));
    });
}

function genResultHTML(booklist) {
    var html = '';

    for (var i = 0; i < booklist.length; i++) {
        var book = booklist[i];

        html += `<div class="modal fade" id="DetailsModal-${book._id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
                    <div class="modal-content">
                        <div class="modal-header bg-primary">
                            <h5 class="modal-title pt-2 text-light">Details for ${book.info.title}</h5>
                        </div>
                        <div class="modal-body text-centered">
                            <div class="text-centered">
                                <h6 class="pt-2 text-dark text-centered">Book title: ${book.info.title}</h6>
                                <h6 class="pt-2 text-dark text-centered">Book author: ${book.info.author}</h6>
                                <h6 class="pt-2 text-dark text-centered">Book ISBN: ${book.info.isbn}</h6>
                            </div>
                            <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal" data-toggle="tooltip" data-placement="top" title="Close">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                
                
            <div class="bg-dark text-center rounded mb-2 p-1" id="book-${book._id}" name="book">

                <h5 class="text-center text-light">${book.info.title}</h5>
                <button type="button" class="btn w-75 mb-2 mx-auto px-auto btn-lg btn-light rounded" data-toggle="modal" data-target="#DetailsModal-${book._id}" data-toggle="tooltip" data-placement="top" title="Click to view book's details">Details</button>
                    
            </div>
            
            `;

    }

    return html;
}
