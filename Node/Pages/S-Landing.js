//**************************************************** IMPORTS **************************************************

//Requires Express Node.js framework
const express = require('express')
var log = require('../Utils/Log').clog;

//***************************************************** SETUP ***************************************************

//router to handle moving the get/post requests around
var router = express.Router();

//Export the router so that Main can access it and our GET/POST functions
module.exports = router;

//********************************************* GET / POST Requests *********************************************

//Handles the get request for the starting form of this page
router.get('/', function(req,res,next) {
    //Headers to try to prevent the page from being cached 
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    // helmet makes the page not render html, unless the content type is set
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    //Get the starting form of the webpage
    getPage(function(err,HTML) {
        if (err) return next(err);

        log.silly('landing');
        //Send the HTML to the client
        res.write(HTML);
        //End our response to the client
        res.end();
    });
});

//********************************************** DEFAULT FUNCTIONS **********************************************

// function to return the html for the page
function getPage(callback) {
    callback(undefined,Template());
}

// function that is specific to each page
function Template() {
    var body = `
    <nav class="navbar navbar-primary bg-primary">
            <a class="navbar-brand">Library</a>
        </nav>
        <div class="mt-2">
            <h3 class="text-center">Welcome to the library system!</h5>
        </div>
        <br>
        <div class="">
            <h4 class="text-center"> This is a placeholder</h4>
            <br>
            <h4 class="text-center">Browse for a book</h4>
        </div>  
    `;
    return addHead(body);

}

function addHead(body) {
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
            <!--<link rel="stylesheet" href="css/bootstrap.min.css"> -->
            <link rel="stylesheet" href="style.css">

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

