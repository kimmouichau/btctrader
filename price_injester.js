var fs = require('fs');

const Promise = require('bluebird');
var rds   = Promise.promisifyAll(require('./rds.js'));

var injectPrices = function injectPrices(filename) {
    var contents = fs.readFileSync(filename, 'utf-8');
    var dayObj = JSON.parse(contents);
    return dayObj;
};

var querystring = require('querystring');
var https = require('https');

var BtcMarketsConfig = {
    url: "https://www.btcmarkets.net",
    uri: {
        priceByTick: "/data/market/BTCMarkets/BTC/AUD/tickByTime?timeWindow=hour&since="
    }
}

var request = require('request');



function getPricesViaRest(test, callback) {
    request(BtcMarketsConfig.url + BtcMarketsConfig.uri.priceByTick, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
    });
}

function getHourlyPricesViaREST(sinceTime, callback) {
    body = request(BtcMarketsConfig.url + BtcMarketsConfig.uri.priceByTick + sinceTime, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
        callback(null, JSON.parse(body).ticks);
    });
}

function selectNewPrices(sinceTime, prices, callback) {
    var pricesToPersist = new Array();

    prices.forEach(function(price) {
        if (price[0] > sinceTime) {
            pricesToPersist.push(price);
        }
    });

    callback(null, pricesToPersist);
}

var fetchHourlyPrices = Promise.promisify(getHourlyPricesViaREST);
var parseNewPrices = Promise.promisify(selectNewPrices);

var lastTimestamp;

exports.myhandler = function(event, context, callback) {
    console.log('start handling btc');

    rds.startConnectionAsync().then(function(result) {
        return rds.getLastTimestampForInstrumentAsync('BTC', 'BTC');
    }).then(function(record) {
        console.log(record);
        lastTimestamp = record;
        return fetchHourlyPrices(record);
    }).then(function(prices) {
        return parseNewPrices(lastTimestamp, prices);
    }).then(function(newPrices) {
        console.log(newPrices);
        return rds.savePricesAsync('BTCMARKETS', 'BTC', newPrices);
    }).then(function (result) {
        console.log(result + "new prices saved successfully");
        process.exit();
    }).catch(function(e) {
        console.log("error loading prices: " + e.message);
        console.log("stack: " + e.stack);
    });
}

console.log('start handling btc');

rds.startConnectionAsync().then(function(result) {
    return rds.getLastTimestampForInstrumentAsync('BTC', 'BTC');
}).then(function(record) {
    console.log(record);
    lastTimestamp = record;
    return fetchHourlyPrices(record);
}).then(function(prices) {
    return parseNewPrices(lastTimestamp, prices);
}).then(function(newPrices) {
    console.log(newPrices);
    return rds.savePricesAsync('BTCMARKETS', 'BTC', newPrices);
}).then(function (result) {
    console.log(result + "new prices saved successfully");
    process.exit();
}).catch(function(e) {
    console.log("error loading prices: " + e.message);
    console.log("stack: " + e.stack);
});
