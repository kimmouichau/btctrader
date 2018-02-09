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

var endpoints = {
    "markets": {
        "BTCMKT": {
            "url": "https://www.btcmarkets.net",
            "uri": {
                "priceByTick": "/data/market/BTCMarkets/{instrument}/AUD/tickByTime?timeWindow=hour&since="
            },
            "instruments": ['BTC', 'XRP', 'ETH']
        },
        "bitfinex": {
            "url": "https://api.cryptowat.ch",
            "uri": {
                "priceByTick": "/markets/bitfinex/{instrument}usd/ohlc?after="
            },
            "instruments": ['btc', 'xrp', 'eth']
        }
    }
};

var request = require('request');


function getHourlyPricesViaREST(exchange, instrument, sinceTime, callback) {
    var agent = new https.Agent();

    var domain = endpoints.markets[exchange].url;
    var uri = endpoints.markets[exchange].uri.priceByTick;
    //var instrument = endpoints.markets[exchange].instruments[instrument];

    var options = {
        url:  domain + uri.replace('{instrument}', instrument) + sinceTime,
        agent: agent
    };

    console.log('fetching prices from ' + options.url);

    request(options, function (error, response, body) {
        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
        prices = parsePricesForExchange(exchange, body);
        callback(null, prices);
        agent.destroy();
    });
};

/**
 * Takes a raw repsonse from an endpoint and then extracts prices into an list of prices
 *
 * @param exchange
 * @param body
 */
function parsePricesForExchange(exchange, body, callback) {
    if (exchange == 'BTCMKTS') {
        //callback(null, JSON.parse(body).ticks);
        return JSON.parse(body).ticks;
    }
    else if (exchange == 'bitfinex') {
        //callback(null, JSON.parse(body).ticks);
        var parsedprices = JSON.parse(body).result["3600"];
/*        var parsedprices = obj.map(function(value) {
            return [value[0], value[1], value[2], value[3], value[4], value[5]];
        });*/
        return parsedprices;
    }
    else {
        //callback(new Error("unable to parse response"), null);
        throw new Error("unable to parse");
    }
}

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
    market = options.market;
    console.log("Processing for: " + market);

    Promise.each(endpoints.markets[market].instruments, function(instrument) {
        console.log('start process ' + instrument);

        return rds.startConnectionAsync().then(function (result) {
            return rds.getLastTimestampForInstrumentAsync(market, instrument);
        }).then(function (record) {
            console.log(record);
            lastTimestamp = record;
            return fetchHourlyPrices(market, instrument, record);
        }).then(function (prices) {
            return parseNewPrices(lastTimestamp, prices);
        }).then(function (newPrices) {
            console.log(newPrices);
            return rds.savePricesAsync(market, instrument, newPrices);
        }).then(function (result) {
            console.log(result + " new entries saved successfully");
            callback(result + " new entries saved successfully");
            //process.exit();
        }).catch(function (e) {
            console.log("error loading prices: " + e.message);
            console.log("stack: " + e.stack);
        });
    });
};

var options = {
    "market": "bitfinex"
}

exports.myhandler(options, null, function(error, result) {
    console.log(error);
    console.log(result);
});