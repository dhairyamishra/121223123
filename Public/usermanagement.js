
function search() {
    if (document.getElementById('searchBy').value != "none") {
        
        $.ajax({
            global: false,
            type: 'POST',
            url: '/usermanagement/userSearch', //The url to post to on the server
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
                    
                    document.getElementById('searchResults').innerHTML = `<h5 class="pt-2 pb-2 text-center text-secondary" id="helpMessage">Sorry, no users match that search</h5>`;
                }
            },
    
            //Handle any errors
            error: function (request, status, error) {
            }
        });
    }
}

function canSubmit() {

    
    var name_test = RegExp('^[a-zA-Z\s]*$');
    var ucard_test = RegExp('^[a-z]+ -{0,10}+$');
    var address_test = RegExp('^^[\w\s\-\\]*$');
    var phone_test = RegExp('^[0-9]{10}$');
    var email_test = RegExp('^\w+@\w+.\w{2,4}$');
    
    

    if (document.getElementById(`newname-${id}`).value == '' || 
        !name_test.test(document.getElementById('newname-${id}').value)) {
        good = false;
    }
    if (document.getElementById('newucard-${id}').value == '' || 
        !ucard_test.test(document.getElementById('newucard-${id}').value)) {
        good = false;
    }
    if (document.getElementById('newaddress-${id}').value == '' || 
        !address_test.test(document.getElementById('newaddress-${id}').value)) {
        good = false;
    }
    if (document.getElementById('newphone-${id}').value == '' || 
        !phone_test.test(document.getElementById('newphone-${id}').value)) {
        good = false;
    }
    if (document.getElementById('newemail-${id}').value == '' || 
        !email_test.test(document.getElementById('newemail-${id}').value)) {
        good = false;
    }
    
    return good;
}

function editDetails(id) {

    document.getElementById(`submitDetails-${id}`).disabled = true;
    document.getElementById(`submitDetails-${id}`).innerText = 'Working';

    init();

    var publicKeyText = document.getElementById('main').getAttribute('data-publickey');

    var publicKey = Uint8Array.from(publicKeyText.split`,`.map(x=>parseInt(x)));

    // id,name,ucard,address,phone,email
    if(!canSubmit())
    {
        document.getElementById('submitwarning').className = "mx-auto-centre mt-2"
        return;
    }
    var data = `${id},${document.getElementById(`newname-${id}`).value},
                        ${document.getElementById(`newucard-${id}`).value},
                        ${document.getElementById(`newaddress-${id}`).value},
                        ${document.getElementById(`newphone-${id}`).value},
                        ${document.getElementById(`newemail-${id}`).value}`
                        ;
    
    var message = encode(data,publicKey);

    $.ajax({
        global: false,
        type: 'POST',
        url: '/usermanagement/updateDetails', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: {
            msg:message
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

function editPassword(username,id) {

    var password_test = RegExp('^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$');
    if (document.getElementById(`newpassword-${id}`).value == '' || 
        !password_test.test(document.getElementById(`newpassword-${id}`).value )) {
        // potentially warn user that nothing happend
        return;
    }

    document.getElementById(`submitPassword-${id}`).disabled = true;
    document.getElementById(`submitPassword-${id}`).innerText = 'Working';

    init();

    var publicKeyText = document.getElementById('main').getAttribute('data-publickey');

    var publicKey = Uint8Array.from(publicKeyText.split`,`.map(x=>parseInt(x)));

    var data = `${username},${document.getElementById(`newpassword-${id}`).value}`;
    
    var message = encode(data,publicKey);

    $.ajax({
        global: false,
        type: 'POST',
        url: '/usermanagement/updatePassword', //The url to post to on the server
        dataType: 'html',

        //The data to send to the server
        data: {
            msg:message
        },

        //The response from the server
        success: function (result) {
            if (result == '/login') {
                window.location.replace('/login');
            }
            else if (result=='done') {
                document.getElementById(`newpassword-${id}`).value = '';
                document.getElementById(`submitPassword-${id}`).disabled = false;
                document.getElementById(`submitPassword-${id}`).innerText = 'Submit';
            }
        },

        //Handle any errors
        error: function (request, status, error) {
        }
    });
}

function removeUser(id) {
    $.ajax({
        global: false,
        type: 'POST',
        url: '/usermanagement/removeUser', //The url to post to on the server
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
                document.getElementById(`username-${id}`).outerHTML = '';
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
