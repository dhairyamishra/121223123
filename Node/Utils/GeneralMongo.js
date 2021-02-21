// module for accessing mongo database
var MongoClient = require('mongodb').MongoClient;

var log = require('./Log').clog;

// public database object initialized to undefined
var dbo = undefined;

// function to initialize database connection
exports.init = function(connectionUrl,callback) {
    // connect to database using mongoclient
    MongoClient.connect(connectionUrl, {useUnifiedTopology: true,useNewUrlParser: true}, function(err,db) {
        // if there is an error connecting to the database, return it
        if (err) return callback(err,undefined);
        
        
        // the database in the cluster is ordos
        dbo = db.db("library");
        
        // return
        callback(undefined,'done');
    });
}

// selects attributes from collection that match query
//select("customers", ["address","name"], {["address.street"]:"Main",name:"Interference", {name:1}}
// this command will return address and name from customers where the street part of address is "Main", and the name is "Interference" sorted by name
exports.select = function(collection, attributes, query, sort, callback) {

    var proj = {};
    for (let i = 0; i < attributes.length; i++) {
        proj[attributes[i]] = 1;
    }

    dbo.collection(collection).find(query).sort(sort).project(proj).toArray(function(err,res) {
        if (err) return callback(err,undefined);
        // dbo.close();
        callback(undefined,res);
    });
}


// insert into collection:
// data as json ex. {address:"Ashpacher",name:"Kristoph"}
exports.insert = function(collection, data, callback) {
    dbo.collection(collection).insertOne(data,function(err,res) {
        if (err) return callback(err,undefined);
        // dbo.close();
        callback(undefined, data._id);
    });
}

// deletes all documents that match the query
// blowup("customers", {name:"Abc Inc"}
// this will delete every record from customers where name is 'Abc Inc'
exports.blowup = function(collection, query, callback) {
    dbo.collection(collection).deleteMany(query, function(err, res) {
        if (err) return callback(err,undefined);
        
        callback(undefined,'done');
    });
}

// updates all documents that match the query
// use $set to set subdocuments
// use $pull to remove subdocuments

// update("customers", {$set:{"address":"Main"}}, {name:"Interference"})
// this will update a record in customers. It will set the address attribute to "Main" of any record that has the name "Interference"

// update("customers", {$pull:{"address":{}}}, {["address.street"]:"Main", name:"Interference"}
// this will update a record in customers. It will remove the address subdocument of the record that has a street of "Main", and a name of "Interference"
exports.update = function(collection, values, query, callback) {
    dbo.collection(collection).updateMany(query, values, function(err, res) {
        if (err) return callback(err,undefined);
        
        callback(undefined,'done');
    });
}