
// checks if the document is in a valid submit state
function canSubmit() {

    var good = true;
    if (document.getElementById('title').value == '') {
        good = false;
    }

    if (document.getElementById('author').value == '') {
        good = false;
    }

    if (document.getElementById('isbn').value == '') {
        good = false;
    }

    if (document.getElementById('numCopies').value == '') {
        good = false;
    }

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
            numCopies:document.getElementById('numCopies').value
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

