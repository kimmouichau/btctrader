
var injester   = require('./price_injester.js');
const Promise = require('bluebird');

var auth   = require('./authentication.js'); //Promise.promisifyAll(require('./authentication.js'));
//var mysql  = Promise.promisifyAll(require('mysql'));
var mysql  = require('mysql');

//var pricesObj = injester.injectPrices('c:/temp/bc_prices_by_hour.json');
//console.log(pricesObj);

var password;
var connection;
var db;

var createConnection= Promise.promisify(createConnection);
var getRdsPassphrase = Promise.promisify(auth.getRdsPassphrase);


function startConnection(callback) {
    getRdsPassphrase().then(function(passphrase) {
        password = passphrase;
        return createConnection(null, null, password, null);
    }).then(function(myconnection) {
        connection = myconnection;
        db = Promise.promisifyAll(connection);
        console.log("mysql connection established");
        callback(null, connection);
    });
}




function createConnection(host, username, password, database, callback) {
    var myconnection = mysql.createConnection({
        host     : 'testinstance.cunjbzflwv9t.ap-southeast-2.rds.amazonaws.com',
        user     : 'priceuser',
        password : password,
        database : 'price'
    });

    myconnection.connect();
    callback(null, myconnection);
};


function savePrices(exchange, instrument, prices, callback) {
    var recordsSaved = 0;

    return Promise.each(prices, function(price) {
         var sql = "INSERT INTO price_hour values('BTCMKT', " + price[0] + ", " + price[1] + ", " + price[2] + ", " + price[3] + ", " + price[4] + ", " + price[5] + ");";
         //   console.log('test');
         console.log(sql);
        //var sql = "select * from price_hour LIMIT 1";

         return db.queryAsync(sql).then(function(result) {
             console.log('1 record inserted');
             recordsSaved++;
         })


     }).then(function(result) {
        callback(null, recordsSaved);
        connection.end();
    });



/*    .then(function(result) {
        callback(null, recordsSaved);
    });*/


};

function getLastTimestampForInstrument(exchange, instrument, callback) {
    var sql = "SELECT timestamp FROM price_hour where type='BC' ORDER BY timestamp DESC LIMIT 1"
    connection.query(sql, function (error, results, fields) {
        if (error) {
            callback(new Error('error retrieving last timestamp: ' + error.message));
            return;
        }
        else {
            callback(null, results[0].timestamp);
            return;
        }
    });
};

//connection.end();

module.exports = {
    getLastTimestampForInstrument: getLastTimestampForInstrument,
    savePrices: savePrices,
    startConnection: startConnection
};