
function searchBy() {
        
        $.ajax({
            global: false,
            type: 'POST',
            url: '/browse/browseBy', //The url to post to on the server
            dataType: 'html',
    
            //The data to send to the server
            data: {
                type: document.getElementById('searchBy').value
            },
    
            //The response from the server
            success: function (result) {
                if (result.length > 0) {
                    document.getElementById('browseResults').innerHTML = result;
                }
                else {
                    
                    document.getElementById('browseResults').innerHTML = `<h5 class="pt-2 pb-2 text-center text-secondary" id="helpMessage">Sorry, the system couldn't find any books</h5>`;
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
    $('#searchBy').change(function() {
        searchBy();
    });
});
