
//Requires the TimeUtils utility
const time = require('./TimeUtils');

//Requires the GeneralMongo utility.
const mon = require("./GeneralMongo");

// custom logger
var log = require('./Log').clog;

// requires email
const mailer = require('./Mailer');

// requires converting string ids to objectids
const {ObjectId} = require('mongodb');

exports.init = function(numDays, callback) {
    setInterval(function() {
        log.silly(`send reminder emails`);

        var collection = 'bookActivity';
        var attributes = ['_id','userId'];
        var query = {
            type: 'borrow',
            returned: 'false',
            reminded: 'false',
            duedate: {
                $lt: time.getTime(0,0,parseInt(numDays),0,0,0)
            }
        };
        var sort = {};
    
        mon.select(collection, attributes, query, sort, function(err,res) {
            if (err) log.error(err);
    
            if (res.length > 0) {
                for (var i = 0; i < res.length; i++) {
                    
                    var collection = 'authentication';
                    var attributes = ['_id','info.email'];
                    var query = {
                        _id: ObjectId(res[i].userId)
                    };
                    var sort = {};

                    var collection2 = 'bookActivity';
                    var values2 = {
                        $set: {
                            reminded: 'true'
                        }
                    };
                    var query2 = {
                        _id : ObjectId(res[i]._id)
                    }
                    mon.update(collection2, values2, query2, function(err, done) {
                        if (err) log.error(err);

                        
                    });
                    
                    mon.select(collection, attributes, query, sort, function(err,emailres) {
                        if (err) log.error(err);

            
                        if (emailres[0] != undefined && emailres[0].info.email != undefined) {

                            var subject = `You have a library book due soon!`;
                            var body = `We have it that you are currently borrowing a book that is due in less than ${numDays} days.
                            Please return the book by the time it is due.
                            
                            Thanks,
                            The Library`;
            
                            mailer.sendEmail(emailres[0].info.email,subject,body, function(err, sent) {
                                if (err) log.error(err);

                                
                
                            });
                        }
                        
                    });
                }
            }
            
            
        });
    },  24 * 3600 * 1000);
    // (once a day)

    callback(undefined, true);
}

