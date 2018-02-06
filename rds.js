const Promise = require('bluebird');
var auth   = require('./authentication.js');
var mysql  = require('mysql');


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
}


/**
 * Persists a list of price entries for a particular exchange and instrument into RDS table
 *
 * @param exchange
 * @param instrument
 * @param prices
 * @param callback
 * @returns {*|PromiseLike<T>|Promise<T>}
 */
function savePrices(exchange, instrument, prices, callback) {
    var recordsSaved = 0;

    return Promise.each(prices, function(price) {
         var sql = "INSERT INTO price_hour values('" + exchange + "', '" + instrument + "', " + price[0] + ", " + price[1] + ", " + price[2] + ", " + price[3] + ", " + price[4] + ", " + price[5] + ");";
         console.log(sql);

         return db.queryAsync(sql).then(function(result) {
             console.log('1 record inserted');
             recordsSaved++;
         })
     }).then(function(result) {
        callback(null, recordsSaved);
        connection.end();
    });
}

/**
 * Returns the most recent timestamp for an instrument price entry.
 * If the instrument does not exist, then 0 is returned.
 *
 * @param exchange
 * @param instrument
 * @param callback
 */
function getLastTimestampForInstrument(exchange, instrument, callback) {
    var sql = "SELECT timestamp FROM price_hour where exchange='" + exchange + "' and type = '" + instrument + "'ORDER BY timestamp DESC LIMIT 1";

    connection.query(sql, function (error, results, fields) {
        if (error) {
            callback(new Error('error retrieving last timestamp: ' + error.message));
            return;
        }
        else if (results.length == 0) {
            callback(null, 0);
            return;
        }
        else {
            callback(null, results[0].timestamp);
            return;
        }
    });
}



module.exports = {
    getLastTimestampForInstrument: getLastTimestampForInstrument,
    savePrices: savePrices,
    startConnection: startConnection
};