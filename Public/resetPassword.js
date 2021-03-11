function resetPassword() {
    var password = document.getElementById('password').value;
    if (password == '') {
        document.getElementById('passerror').innerHTML = `<h5 class="text-danger text-center">Make sure password is filled out</h5>`;
    }
    else {
        document.getElementById('passerror').innerHTML = `<h5 class="text-dark text-center">Resetting...</h5>`;
    }
    
    init();
    
    var main = document.getElementById('main');
    var publicKeyText = main.getAttribute('data-publickey');

    var publicKey = Uint8Array.from(publicKeyText.split`,`.map(x=>parseInt(x)));

    var data = `${main.getAttribute('data-userId').replaceAll(',','*')},${main.getAttribute('data-username')},${password},`;
    
    var message = encode(data, publicKey);

    $.ajax({

        global: false,
        type: 'POST',
        url: '/reset/updatePassword', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: { 
            data : message
        },

        //The response from the server; result is the data sent back from server; i.e. html code
        success: function (result) {
            window.location.replace(result);
        },

        //Handle any errors
        error: function (request, status, error) { 
            console.error(error);
            serviceError();
        }
    });
}