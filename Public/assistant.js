function logout() {
    $.ajax({
        global: false,
        type: 'POST',
        url: '/manager/logout', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: {            
        },

        //The response from the server
        success: function (result) {
            window.location.replace(result);
        },

        //Handle any errors
        error: function (request, status, error) {
        }
    });
}