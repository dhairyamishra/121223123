//Using libsodium for encryption. Paired with cryptoclient.js on the client side. 
//Requires 'npm install libsodium-wrappers'

//Require the npm module
const sodium = require('libsodium-wrappers');

//Require the database module
const mon = require('./GeneralMongo');

// hashes passwords
function hash(password,callback) {
    var hashed = sodium.crypto_pwhash_str(password,
        sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        sodium.crypto_pwhash_MEMLIMIT_MODERATE);
    
    callback(undefined,hashed);
}

exports.hash = hash;
exports.verify = function(hash,value,callback) {
    var matches = sodium.crypto_pwhash_str_verify(hash,value);
    callback(undefined,matches);
}

// function to get the all of the usernames from the database
exports.getUserNames = function(callback) {

    var collection = 'authentication';
    var attributes = ['username'];
    var query = {};
    var sort = {};

    //Try to select the first and last names from the database
    mon.select(collection, attributes, query, sort, function(err,data) {
        if (err) return callback(err,undefined);
        // why only return the first username? *************************************
        callback(undefined,data[0].username);
    });
}

usernameTaken = function(username,callback) {
    var collection = 'authentication';
    var attributes = ['_id'];
    var query = {
        username:username
    };
    var sort = {};

    mon.select(collection, attributes,query,sort,function(err,res) {
        if (err) return callback(err,undefined);
        
        callback(undefined, res.length);
    });
}

//Returns (success)
// function to add a user with an authorization level
exports.addAuthForLevel = function(level,username,password,email,callback) {
    usernameTaken(username, function(err,taken) {
        if (err) return callback(err,undefined);

        if (taken) {
            return callback(undefined, 'fail')
        }

        hash(password, function(err,hashed) {
            if (err) return callback(err,undefined);
    
            var collection = 'authentication';
            var data = {
                level:level,
                username:username,
                email:email,
                hash:hashed
            };
    
            //Add the new user to the database
            mon.insert(collection, data, function(err2,done) {
                if (err2) return callback(err2,undefined);
                callback(undefined,'success');
            });
        });
    });
    
}

//Returns (success,authId,level)
// function to verify if username an password are in the database
exports.authenticate = function(username,password,callback) {
    var collection = 'authentication';
    var attributes = ['hash', 'authId', 'level'];
    var query = {
        username:username
    };
    var sort = {};

    //Try to select the first and last names from the database
    mon.select(collection, attributes, query, sort, function(err,data) {
        if (err) return callback(err,undefined,undefined,undefined);
        // for every password associated with the username, check the hash
        for(var i = 0; i < data.length; i++) {
            var hash = data[0].hash;
            var authId = data[0].authId;
            var level = data[0].level;

            var valid = sodium.crypto_pwhash_str_verify(hash,password);

            if(valid) {
                return callback(undefined,true,authId,level);
            }
        }
        return callback(undefined,false,undefined,undefined);
    });
}

//Returns (success,authId,level)
// function to verify if a user is a certain level
exports.authenticateAtLevel = function(username,password,level,callback) {

    var collection = 'authentication';
    var attributes = ['hash', 'authId', 'level'];
    var query = {
        username:username,
        level:level
    };
    var sort = {};

    //Try to select the first and last names from the database
    mon.select(collection, attributes, query, sort, function(err,data) {
        if (err) return callback(err,undefined,undefined,undefined);

        for(var i = 0; i < data.length; i++) {
            var hash = data[0].hash;
            var authId = data[0].authId;
            var level = data[0].level;

            var valid = sodium.crypto_pwhash_str_verify(hash,password);

            if(valid) {
                return callback(undefined,true,authId,level);
            }
        }
        return callback(undefined,false,undefined,undefined);
    });
}

//Returns (success)
// removes a user's credentials
exports.removeOnAuthId = function(authId,callback) {

    var collection = 'authentication';
    var query = {
        authId:authId
    };

    mon.blowup(collection, query, function(err,done) {
        if (err) return callback(err,undefined);
        callback(undefined,done);
    });
}

exports.removeOnUsername = function(username,callback) {

    var collection = 'authentication';
    var query = {
        username:username
    };

    mon.blowup(collection, query, function(err,done) {
        if (err) return callback(err,undefined);
        callback(undefined,done);
    });
}

//Returns (success)
// removes all users' credentials with certain level
exports.removeAllAuthForLevel = function(level, callback) {

    var collection = 'authentication';
    var query = {
        level:level
    };

    mon.blowup(collection, query, function(err,done) {
        if (err) return callback(err,undefined);
        callback(undefined,done);
    });
}

exports.updatePassword = function(username,newPassword, callback) {
    hash(newPassword, function(err, pwhash) {
        if (err) return callback(err);

        var collection = 'authentication';
        var query = {
            username: username
        };
        var values = {
            $set: {
                hash:pwhash
            }
        };

        mon.update(collection, values, query, function(err, done) {
            if (err) return callback(err);

            callback(undefined,done);
        });
    });
    
}