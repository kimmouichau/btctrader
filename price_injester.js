const Promise = require('bluebird');
var rds = Promise.promisifyAll(require('./rds.js'));


var querystring = require('querystring');
var https = require('https');

var BtcMarketsConfig = {
    url: "https://www.btcmarkets.net",
    uri: {
        priceByTick: "/data/market/BTCMarkets/{instrument}/AUD/tickByTime?timeWindow=hour&since="
    },
    instruments: ['BTC', 'XRP', 'ETH']
};

var request = require('request');


function getHourlyPricesViaREST(instrument, sinceTime, callback) {
    var agent = new https.Agent();

    var options = {
        url:  BtcMarketsConfig.url + BtcMarketsConfig.uri.priceByTick.replace('{instrument}', instrument) + sinceTime,
        agent: agent
    };

    console.log('fetching prices from ' + options.url);

    request(options, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        callback(null, JSON.parse(body).ticks);
        agent.destroy();
    });
};

function selectNewPrices(sinceTime, prices, callback) {
    var pricesToPersist = new Array();

    prices.forEach(function(price) {
        if (price[0] > sinceTime) {
            pricesToPersist.push(price);
        }
    });

    callback(null, pricesToPersist);
};

var fetchHourlyPrices = Promise.promisify(getHourlyPricesViaREST);
var parseNewPrices = Promise.promisify(selectNewPrices);
var lastTimestamp;

exports.myhandler = function(event, context, callback) {
    Promise.each(BtcMarketsConfig.instruments, function(instrument) {
        console.log('start process ' + instrument);

        return rds.startConnectionAsync().then(function (result) {
            return rds.getLastTimestampForInstrumentAsync('BTCMKT', instrument);
        }).then(function (record) {
            console.log(record);
            lastTimestamp = record;
            return fetchHourlyPrices(instrument, record);
        }).then(function (prices) {
            return parseNewPrices(lastTimestamp, prices);
        }).then(function (newPrices) {
            console.log(newPrices);
            return rds.savePricesAsync('BTCMKT', instrument, newPrices);
        }).then(function (result) {
            console.log(result + " new entries saved successfully");
            callback(result + " new entries saved successfully");
            //process.exit();
        }).catch(function (e) {
            console.log("error loading prices: " + e.message);
            console.log("stack: " + e.stack);
        });
    });
}

/*console.log('start handling btc');

Promise.each(BtcMarketsConfig.instruments, function(instrument) {
    console.log('start process ' + instrument);

    return rds.startConnectionAsync().then(function (result) {
        return rds.getLastTimestampForInstrumentAsync('BTCMKT', instrument);
    }).then(function (record) {
        console.log(record);
        lastTimestamp = record;
        return fetchHourlyPrices(instrument, record);
    }).then(function (prices) {
        return parseNewPrices(lastTimestamp, prices);
    }).then(function (newPrices) {
        console.log(newPrices);
        return rds.savePricesAsync('BTCMKT', instrument, newPrices);
    }).then(function (result) {
        console.log(result + " new entries saved successfully");
        //callback(result + " new entries saved successfully");
        //process.exit();
    }).catch(function (e) {
        console.log("error loading prices: " + e.message);
        console.log("stack: " + e.stack);
    });
});*/
