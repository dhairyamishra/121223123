function search() {
    if (document.getElementById('searchBy').value != "none") {
        
        $.ajax({
            global: false,
            type: 'POST',
            url: '/search/bookSearch', //The url to post to on the server
            dataType: 'html',
    
            //The data to send to the server
            data: {
                searchString: DOMPurify.sanitize(document.getElementById('searchBox').value),
                searchType: document.getElementById('searchBy').value,
                sortType: document.getElementById('sortBy').value
            },
    
            //The response from the server
            success: function (result) {
                if (result.length > 0) {
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

//AJAX Functions

//Wait to execute until AJAX is ready
$(document).ready(function ()  {
    // detects if enter key is pressed
    $(document).keypress(function(event) {
        if (event.which==13) {
            search();
        }
    });
});
