
// checks if the document is in a valid submit state
function canSubmit() {

    var good = true;
    var title_test = new RegExp('^[a-zA-Z]*$');
    var author_test = new RegExp('^[a-zA-Z]*$');
    var isbn_test = new RegExp('^98+[0-9]{10,13}$');
    var numCopies_test = new RegExp('^\d+$');
    
    var title = document.getElementById('title').value;
    var author = document.getElementById('author').value;
    var isbn = document.getElementById('isbn').value 
    var numCompies = document.getElementById('numCopies').value
    
    if(!title_test.test(title) || title == "")
        good = false;
    if(!author_test.test(author) || author == "")
        good = false;
    if(!isbn_test.test(isbn) || author == "")
        good = false;
    if(!numCopies_test.test(numCompies) || author == "")
        good = false;
    
    return good;
}

function createBook(sender) {
    if (!canSubmit()) {
        document.getElementById('submitwarning').className = "mx-auto text-center mt-2";
        return;
    }

    var formData = new FormData();
    formData.append('title',document.getElementById('title').value);
    formData.append('author',document.getElementById('author').value);
    formData.append('isbn',document.getElementById('isbn').value);
    formData.append('numCopies',document.getElementById('numCopies').value);
    formData.append('term',document.getElementById('shortterm').checked);

    $.ajax({
        global: false,
        type: 'POST',
        url: '/createbook/createBook', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: {
            title:document.getElementById('title').value,
            author:document.getElementById('author').value,
            isbn:document.getElementById('isbn').value,
            numCopies:document.getElementById('numCopies').value,
            term:document.getElementById('shortterm').checked
        },

        //The response from the server
        success: function (result) {
            // disable_submit();
            window.location.replace(result);
        },

        //Handle any errors
        error: function (request, status, error) {
        }
    });
}


//AJAX Functions

//Wait to execute until AJAX is ready
$(document).ready(function ()  {
});

