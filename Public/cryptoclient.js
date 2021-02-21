
var keys;
var initalized = false;

function init() {
    if(!initalized) {
        keys = window.sodium.crypto_box_keypair();
        initalized = true;
    }
}

function encode(message, recipientPublicKey) {
    var nonce = window.sodium.randombytes_buf(window.sodium.crypto_box_NONCEBYTES);
    var ourKeys = keys;

    var box = window.sodium.crypto_box_easy(message, nonce, recipientPublicKey, ourKeys.privateKey);

    var data = '' + recipientPublicKey + '.' + ourKeys.publicKey + '.' + nonce + '.' + box;
    
    return data;
}

function decode(data) {
    var firstSplit = data.split('.');
    var theirPulbicKey = Uint8Array.from(firstSplit[0].split`,`.map(x=>parseInt(x)));
    var nonce = Uint8Array.from(firstSplit[1].split`,`.map(x=>parseInt(x)));
    var box = Uint8Array.from(firstSplit[2].split`,`.map(x=>parseInt(x)));

    var decoded = sodium.crypto_box_open_easy(box, nonce, theirPulbicKey, keys.privateKey);
    
    var decodedAsString = String.fromCharCode.apply(null, decoded);

    return decodedAsString;
}

function encodeResponse(newMessage, oldMessage)
{
    var firstSplit = oldMessage.split('.');
    var theirPulbicKey = Uint8Array.from(firstSplit[1].split`,`.map(x=>parseInt(x)));

    var nonce = sodium.randombytes_buf(window.sodium.crypto_box_NONCEBYTES);
    var ourKeys = keys;

    var box = sodium.crypto_box_easy(newMessage, nonce, theirPulbicKey, ourKeys.privateKey);

    var data = '' + theirPublicKey + '.' + ourKeys.publicKey + '.' + nonce + '.' + box;

    return data;
}