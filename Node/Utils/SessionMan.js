
const crypto = require('crypto');
const mon = require('./GeneralMongo');
const time = require('./TimeUtils');

var log = require('./Log').clog;

// //Call the program specific funcion to manage sessonData
// const UserType = require('../Pages/S-UserType');

//Sets the session lifetime of the different access levels
//Level : lifetime  ---  lifetime in minutes
var lifetimes = { 
    1: 10, //Normal user
    2: 480,  // manager page
    3: 480,  // creator page
    4: 5 // admin page (if existant)
};

//Sets up functions to execute at the correct intervals
var keys = Object.keys(lifetimes);
for(let i = 0; i < keys.length; i++) {

    // ***** Don't know how to log errors in a setInterval *****

    //Function to remove old sessions after a given number of minutes
    setInterval(function() {
        //Every sessionLifetimeCheckTime delete the old sessions from the database.
        deleteOldSessions(parseInt(keys[i]), lifetimes[keys[i]], function(err,success) {
            if (err) log.error(err);

            // //Call the program specific funcion to manasge sessonData
            // UserType.deleteOldSessionData()
        });
    }, lifetimes[keys[i]] * 60 * 1000);
}


exports.renewSessionId = function(sessionId, callback) {
    //Get the current time to use as the renewed time
    var currentTime = time.getTime();
    
    var collection = 'sessions';
    var attributes = ['creationDatetime'];
    var query = {
        sessionId:sessionId
    };
    var sort = {};

    //Will only return values if the session id exists
    mon.select(collection, attributes, query, sort, function(err,creationDatetime) {
        if (err) return callback(err,undefined);

        if (currentTime < creationDatetime[0]) {
            currentTime = creationDatetime[0];
        }

        var collection = 'sessions';
        var values = {
            $set: {
                renewedDatetime:currentTime
            }
        };
        var query = {
            sessionId:sessionId
        }

        //update renewedDatetime to the current time
        mon.update(collection, values, query, function(err, success) {
            if (err) return callback(err,undefined);
            callback(undefined,success);
        });
    });
}

//Gets a new valid session Id for the provided access level.
exports.getNewSessionId = function(level,time, callback) {
    //Loops until a valid id is found

    //Get 16 random bytes
    crypto.randomBytes(16, function(err, buf) {
        if (err) return callback(err,undefined);

        //Convert the 16 random bytes to a 32 character hexadecimal number
        var id = buf.toString('hex');

        //Check to see if the newly generated id already exists
        idExists(id, function(err2, exists) {
            if (err2) return callback(err2,undefined);

            //If the id does not exist it is valid and can be used, otherwise it is not valid and we
            //  need to try again
            if(!exists) {
                //End the loop
                valid = true;

                //Insert the id into the database
                insertId(id, level,time, function(err3,success){
                    if (err3) return callback(err3,undefined);

                    //callback with the valid id
                    return callback(undefined,id);
                });
            }
            else
            {
                //If the session id was invalid, try again.
                getNewSessionId(level,time, function(err4,id) {
                    if (err4) return callback(err4,undefined);
                    callback(undefined,id);
                });
            }
        });
    });
}

//Checks if a provided session Id is valid at the provided permission level
exports.sessionIdValid = function(sessionId, level, callback) {

    //Query the database and callback with the result
    idExistsAtLevel(sessionId, level, function(err,exists) {
        if (err) return callback(err,undefined);
        callback(undefined,exists);
    });
}

exports.removeSessionId = function(sessionId, callback) {
    var collection = 'sessions';
    var query = {
        sessionId: sessionId
    };

    mon.blowup(collection, query, function(err,res) {
        if (err) return callback(err,undefined);

        callback(undefined, res);
    })
}
function getNewSessionId(level,time, callback) {

    valid = false;

    //Loops until a valid id is found

    //Get 16 random bytes
    crypto.randomBytes(16, function(err, buf) {
        if (err) return callback(err,undefined);

        //Convert the 16 random bytes to a 32 character hexadecimal number
        var id = buf.toString('hex');

        //Check to see if the newly generated id already exists
        idExists(id, function(err2,exists) {
            if (err2) return callback(err2,undefined);

            //If the id does not exist it is valid and can be used, otherwise it is not valid and we
            //  need to try again
            if(!exists) {
                //End the loop
                valid = true;

                //Insert the id into the database
                insertId(id, level, time, function(err3,success){
                    if (err3) return callback(err3,undefined);

                    //callback with the valid id
                    return callback(undefined,id);
                });
            }
            else
            {
                getNewSessionId(level, time, function(err4,id) {
                    if (err4) return callback(err4,undefined);
                    callback(undefined,id);
                });
            }
        });
    });
}

function deleteOldSessions(level, lifetime, callback) {
    //Get the current time minus the session lifetime to use in database query
    var deleteTime = time.getTime(0,0,0,0,(-1 * lifetime),0);

    var collection = 'sessions';
    var query = {
        level:level, 
        renewedDatetime: {
            $lt:deleteTime
        }
    };

    //Delete any sessions older than deleteTime
    mon.blowup(collection,query, function(err,res){ 
        if (err) return callback(err,undefined);

        //Calls back with true if successful or false if not
        callback(undefined,res);
    });
}

function insertId(id, level, time, callback) {

    var collection = 'sessions';
    var data = {
        sessionId:id,
        level: level,
        creationDatetime:time,
        renewedDatetime: time
    };

    mon.insert(collection, data ,function(err,success) {
        if (err) return callback(err,undefined);
        callback(undefined,success);
    });
}

//Querys the database to see if the sessionId exists
function idExists(id, callback) {

    var collection = 'sessions';
    var attributes = ['sessionId'];
    var query = {
        sessionId:id
    };
    var sort = {};

    //Will only return values if the session id exists
    mon.select(collection, attributes, query, sort, function(err,ids) {
        if (err) return callback(err,undefined);

        //After checking callback if the id was found and false if it was not
        if(ids.length == 0) {
            return callback(undefined,false);
        }
        else {
            return callback(undefined,true);
        }
    });
}

//Checks if the id exist with the given perimission level
function idExistsAtLevel(id, level, callback) {

    var collection = 'sessions';
    var attributes = ['sessionId'];
    var query = {
        sessionId:id,
        level:level
    };
    var sort = {};

    //Will only return values if the session id exists
    mon.select(collection, attributes, query, sort, function(err,ids) {
        if (err) return callback(err,undefined);

        //After checking callback true if the id was found and false if it was not
        if(ids.length == 0) {
            return callback(undefined,false);
        }
        else {
            return callback(undefined,true);
        }
    });
}