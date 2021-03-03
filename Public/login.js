
function forgotPassword() {
    var username = document.getElementById('username').value;
    if (username == '') {
        document.getElementById('autherror').innerHTML = `<h5 class="text-danger text-center">Make sure username is filled out</h5>`;
    }
    else {
        document.getElementById('autherror').innerHTML = `<h5 class="text-danger text-center">Requested password reset through your account email</h5>`;
    }
    
    init();
        
    var publicKeyText = document.getElementById('main').getAttribute('data-publickey');

    var publicKey = Uint8Array.from(publicKeyText.split`,`.map(x=>parseInt(x)));

    var data = `${username}`;
    
    var message = encode(data, publicKey);

    $.ajax({

        global: false,
        type: 'POST',
        url: '/login/forgotPassword', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: { 
            data : message
        },

        //The response from the server; result is the data sent back from server; i.e. html code
        success: function (result) {
            if (result == 'timeout') {
                document.getElementById('autherror').innerHTML = `<h5 class="text-warning text-center">The server encountered an error, please refresh the browser</h5>`;
            }
            // document.getElementById('autherror').innerHTML = `<h5 class="text-danger text-center">That username or password is invalid</h5>`;
        },

        //Handle any errors
        error: function (request, status, error) { 
            console.error(error);
            serviceError();
        }
    });
}

$(document).ready(function ()  {
    // detects if enter key is pressed
    $(document).keypress(function(event) {
        if(event.charCode == 13 && document.getElementById('username').value.length > 0 && document.getElementById('password').value.length > 0) {
            $('#login').click();
        }
    });


    //Called when user clicks 'Submit' button
    $('#login').click(function(event) { 
        // document.getElementById("login").className = "not-ready";
        document.getElementById('autherror').innerHTML = `<h5 class="text-dark text-center">Hashing and validating credentials...</h5>`

        init();
        
        var publicKeyText = document.getElementById('main').getAttribute('data-publickey');

        var publicKey = Uint8Array.from(publicKeyText.split`,`.map(x=>parseInt(x)))

        var data = `${document.getElementById('username').value},${document.getElementById('password').value},${document.getElementById('remember').checked}`;
        
        var message = encode(data, publicKey);
        
        $.ajax({

            global: false,
            type: 'POST',
            url: '/login/auth', //The url to post to on the server
            dataType: 'html',

            //The data to send to the server
            data: { 
                data : message
            },

            //The response from the server; result is the data sent back from server; i.e. html code
            success: function (result) { 
                if(result == '-1') {
                    document.getElementById('autherror').innerHTML = `<h5 class="text-danger text-center">That username or password is invalid</h5>`;
                    // document.getElementById("login").className = "ready";
                }
                else if(result == 'timeout') {
                    document.getElementById('autherror').innerHTML = `<h5 class="text-warning text-center">The server encountered an error, please refresh the browser</h5>`;
                    
                }
                else {
                    window.location.replace(result);
                }
            },

            //Handle any errors
            error: function (request, status, error) { 
                console.error(error);
                serviceError();
            }
        });
    });

    
});