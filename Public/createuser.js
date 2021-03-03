
// checks if the document is in a valid submit state
function canSubmit() {

    
    var good = true;
    var name_test = RegExp('^[a-zA-Z\s]*$');
    var ucard_test = RegExp('^[a-z]{0,10}+$');
    var address_test = RegExp('^[a-z]{0,10}+$');
    var phone_test = RegExp('[0-9]{10}');
    var email_test = RegExp('^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    
    if (document.getElementById('usertype').value == 'none') {
        good = false;
    }

    if (document.getElementById('name').value == '' || !name_test.test(document.getElementById('name').value)) {
        good = false;
    }
    if (document.getElementById('ucard').value == '' || !ucard_test.test(document.getElementById('ucard').value)) {
        good = false;
    }
    if (document.getElementById('address').value == '' || !address_test.test(document.getElementById('address').value)) {
        good = false;
    }
    if (document.getElementById('phone').value == '' || !phone_test.test(document.getElementById('phone').value)) {
        good = false;
    }
    if (document.getElementById('email').value == '' || !email_test.test(document.getElementById('email').value)) {
        good = false;
    }
    if (document.getElementById('usertype').value !== '1') {
        if (document.getElementById('username').value == '') {
            good = false;
        }
    
        if (document.getElementById('password').value == '') {
            good = false;
        }
    }
    
    return good;
}

function usernameTaken() {
    document.getElementById('usernameValid').className = "text-center";
    document.getElementById('username').focus();

    document.getElementById('submit').disabled = false;
    document.getElementById('submit').innerText = 'Create User';
    
}

function graphicSubmit() {
    document.getElementById('usernameValid').className = "d-none";
    document.getElementById('submitwarning').className = "d-none";
    document.getElementById('submit').disabled = true;
    document.getElementById('submit').innerText = 'Creating...';
}

function createUser() {
    if (!canSubmit()) {
        document.getElementById('submitwarning').className = "mx-auto text-center mt-2";
        return;
    }

    graphicSubmit();

    init();

    var publicKeyText = document.getElementById('main').getAttribute('data-publickey');

    var publicKey = Uint8Array.from(publicKeyText.split`,`.map(x=>parseInt(x)));

    //username,usertype,password,name,ucard,address,phone,email
    var data = `${document.getElementById('username').value},${document.getElementById('usertype').value},${document.getElementById('password').value},${document.getElementById('name').value},${document.getElementById('ucard').value},${document.getElementById('address').value},${document.getElementById('phone').value},${document.getElementById('email').value}`;
    
    var message = encode(data,publicKey);

    $.ajax({
        global: false,
        type: 'POST',
        url: '/createuser/createUser', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: {
            msg: message
            
        },

        //The response from the server
        success: function (result) {
            if (result == '/login') {
                window.location.replace(result);
            }
            else if (result == '/manage') {
                window.location.replace(result);
            }
            else {
                usernameTaken();
                
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
    $('#usertype').change(function() {
        opt=$(this).val();
        if (opt=="1") {
            $('#authentication').collapse('hide');
        }
        else if (opt=="2") {
            $('#authentication').collapse('show');
        }
        else if (opt=="3") {
            $('#authentication').collapse('show');
        }
    });
});
