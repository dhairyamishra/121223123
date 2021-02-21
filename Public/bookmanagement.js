
function search() {
    if (document.getElementById('searchBy').value != "none") {
        
        $.ajax({
            global: false,
            type: 'POST',
            url: '/bookmanagement/bookSearch', //The url to post to on the server
            dataType: 'html',
    
            //The data to send to the server
            data: {
                searchString: document.getElementById('searchBox').value,
                searchType: document.getElementById('searchBy').value
            },
    
            //The response from the server
            success: function (result) {
                if (result == '/login') {
                    window.location.replace('/login');
                }
                else if (result.length > 0) {
                    document.getElementById('searchResults').innerHTML = result;
                }
                else {
                    
                    document.getElementById('searchResults').innerHTML = `<h5 class="pt-2 pb-2 text-center text-secondary" id="helpMessage">Sorry, no books match that search</h5>`;
                }
            },
    
            //Handle any errors
            error: function (request, status, error) {
            }
        });
    }
}

function editDetails(id) {

    document.getElementById(`submitDetails-${id}`).disabled = true;
    document.getElementById(`submitDetails-${id}`).innerText = 'Working';

    $.ajax({
        global: false,
        type: 'POST',
        url: '/bookmanagement/updateDetails', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: {
            id:id,
            title:document.getElementById(`newtitle-${id}`).value,
            author:document.getElementById(`newauthor-${id}`).value,
            isbn:document.getElementById(`newisbn-${id}`).value,
            numCopies:document.getElementById(`newnumcopies-${id}`).value
        },

        //The response from the server
        success: function (result) {
            if (result == '/login') {
                window.location.replace('/login');
            }
            else if (result=='done') {
                document.getElementById(`submitDetails-${id}`).disabled = false;
                document.getElementById(`submitDetails-${id}`).innerText = 'Submit';
            }
        },

        //Handle any errors
        error: function (request, status, error) {
        }
    });
}

function removeBook(id) {
    $.ajax({
        global: false,
        type: 'POST',
        url: '/bookmanagement/removeBook', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: {
            id:id
        },

        //The response from the server
        success: function (result) {
            if (result == '/login') {
                window.location.replace('/login');
            }
            else if (result=='done') {
                document.getElementById(`book-${id}`).outerHTML = '';
            }
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
