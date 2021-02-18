//Using libsodium for encryption. Paired with CryptoClient.js on the client side. 
//Requires 'npm install libsodium-wrappers'

//Require the npm module
const sodium = require('libsodium-wrappers');
var log = require('./Log').clog;

//Require the database module
const mon = require('./GeneralMongo');

//Variables to store the keys. 

//The lifetime of the keypair on the server in minutes
//The current public key will be sent to all newly connecting clients.
//The preivous keypair is also stored in the database in order to authenticate
//  any older requests that still have to come in.

//If session tracking is being used then this should be the same as or longer than the session
//  timeout interval
var serverKeyLifetime = 24 * 60; //In minutes

// gets the encryption keys for an authenticated session
function getKeys(callback) {
    //table, columns, params, operators, values, extraSQL, callback

    // var table = 'encryptionKeys';
    // var columns = [`publicKey`,`privateKey`,`age`];
    // var params = [];
    // var operators = [];
    // var values = [];
    // var extraSQL = 'ORDER BY age';

    var collection = 'encryptionKeys';
    var attributes = ['publicKey', 'privateKey', 'age'];
    var query = {};
    var sort = {age:1};

    mon.select(collection, attributes, query, sort, function(err,data) {
        if (err) return callback(err,undefined,undefined,undefined,undefined);
        //key1.public,key1.private,key2.public,key2.private


        var newPublic = Uint8Array.from(Object.values(data[0].publicKey));//.split`,`.map(x=>parseInt(x)));
        var newPrivate = Uint8Array.from(Object.values(data[0].privateKey));//.split`,`.map(x=>parseInt(x)));
        var oldPublic = Uint8Array.from(Object.values(data[1].publicKey));//.split`,`.map(x=>parseInt(x)));
        var oldPrivate = Uint8Array.from(Object.values(data[1].privateKey));//.split`,`.map(x=>parseInt(x)));

        callback(undefined,newPublic, newPrivate, oldPublic, oldPrivate);
    });
}

// gets all the public keys
exports.getPublicKey = function(callback) {
    getKeys(function(err,newPublic,newPrivate,oldPublic,oldPrivate) {
        if (err) return callback(err,undefined);
        callback(undefined,newPublic);
    });
}

// sets up encryption
exports.init = function(callback) {
    // var table = 'encryptionKeys';
    // var params = [];
    // var values = [];

    var collection = 'encryptionKeys';
    var query = {};

    // deletes the old keys
    mon.blowup(collection, query, function(err,done) {
        if (err) return callback(err,undefined);

        var keys = sodium.crypto_box_keypair();
    
        // var table = 'encryptionKeys';
        // var columns = ['publicKey','privateKey','age'];
        // var values = [`'${keys.publicKey}'`,`'${keys.privateKey}'`,`2`];

        var collection = 'encryptionKeys';
        var data = {
            publicKey:keys.publicKey,
            privateKey: keys.privateKey,
            age:'2'
        };
        
        // create new keys
        mon.insert(collection, data, function(err2,done) {
            if (err2) return callback(err2,undefined);

            var keys = sodium.crypto_box_keypair();
    
            // var table = 'encryptionKeys';
            // var columns = ['publicKey','privateKey','age'];
            // var values = [`'${keys.publicKey}'`,`'${keys.privateKey}'`,`1`];

            var collection = 'encryptionKeys';
            var data = {
                publicKey:keys.publicKey,
                privateKey: keys.privateKey,
                age:'1'
            };
            
            mon.insert(collection, data, function(err3,done) {
                if (err3) return callback(err3,undefined);
                callback(undefined,done);
            });
        });
    });
}

// encodes a string using recipient's public key
exports.encode = function(message, recipientPublicKey, callback) {
    getKeys(function(err,newPublic,newPrivate,oldPublic,oldPrivate) {
        if (err) return callback(err,undefined);

        var nonce = sodium.randombytes_buf(window.sodium.crypto_box_NONCEBYTES);

        var box = sodium.crypto_box_easy(message, nonce, recipientPublicKey, newPrivate);

        var data = '' + newPublic + '.' + nonce + '.' + box;

        callback(undefined,data);
    });
}

// decodes a message encrypted with public key
exports.decode = function(data, callback) {
    getKeys(function(err,newPublic,newPrivate,oldPublic,oldPrivate) {
        if (err) return callback(err,undefined,undefined);

        var firstSplit = data.split('.');
        var ourPublicKey = Uint8Array.from(firstSplit[0].split`,`.map(x=>parseInt(x)));
        var theirPulbicKey = Uint8Array.from(firstSplit[1].split`,`.map(x=>parseInt(x)));
        var nonce = Uint8Array.from(firstSplit[2].split`,`.map(x=>parseInt(x)));
        var box = Uint8Array.from(firstSplit[3].split`,`.map(x=>parseInt(x)));

        var decoded;
        var success;

        if(newPublic.toString() == ourPublicKey.toString()) {
            decoded = sodium.crypto_box_open_easy(box, nonce, theirPulbicKey, newPrivate);
            success = true;
        }
        else if(oldPublic.toString() == ourPublicKey.toString()) {
            decoded = sodium.crypto_box_open_easy(box, nonce, theirPulbicKey, oldPrivate);
            success = true;
        }
        else {
            decoded = undefined;
            success = false;
        }

        var decodedAsString;
        if(success)
        {
            decodedAsString = String.fromCharCode.apply(null, decoded);
        }
        else
        {
            decodedAsString = undefined;
        }

        callback(undefined,success, decodedAsString);

    });
}

// encodes a message based on our private and their public keys
exports.encodeResponse = function(newMessage, oldMessage, callback)
{
    getKeys(function(err,newPublic,newPrivate,oldPublic,oldPrivate) {
        if (err) return callback(err,undefined);

        var firstSplit = oldMessage.split('.');
        var theirPulbicKey = Uint8Array.from(firstSplit[1].split`,`.map(x=>parseInt(x)));

        var nonce = sodium.randombytes_buf(window.sodium.crypto_box_NONCEBYTES);

        var box = sodium.crypto_box_easy(newMessage, nonce, theirPulbicKey, newPrivate);

        var data = '' + newPublic + '.' + nonce + '.' + box;

        callback(undefined,data);
    });
}

// ***** Don't know how to log errors in a setInterval ******

// interval to make clients re-authenticate
setInterval(function() {
    log.silly(`refresh encryption keys`);
    // var table = 'encryptionKeys';
    // var params = ['age'];
    // var values = ['2'];

    var collection = 'encryptionKeys';
    var query = {
        age:'2'
    };

    mon.blowup(collection, query, function(err,done) {
        if (err) log.error(err);
        // var table = 'encryptionKeys';
        // var columns = ['age'];
        // var colValues = ['2'];
        // var params = ['age'];
        // var parValues = ['1'];

        var collection = 'encryptionKeys';
        var values = {
            $set: {
                age:'2'
            }
        };
        var query = {
            age:'1'
        };
        
        mon.update(collection, values, query, function(err,done) {
            if (err) log.error(err);
            var keys = sodium.crypto_box_keypair();
    
            // var table = 'encryptionKeys';
            // var columns = ['publicKey','privateKey','age'];
            // var values = [`'${keys.publicKey}'`,`'${keys.privateKey}'`,`1`];
    
            var collection = 'encryptionKeys';
            var data = {
                publicKey:keys.publicKey,
                privateKey:keys.privateKey,
                age:'1'
            };

            //Add the new user to the database
            mon.insert(collection, data, function(err,done) {
                if (err) log.error(err);
                getKeys(function(a,b,c,d){});
            });
        });
    });
}, serverKeyLifetime * 60 * 1000);