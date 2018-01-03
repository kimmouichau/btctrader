const Request = require('request');
const Promise = require('bluebird');

function getPrice() {
    Request.get(ExchangeUrls.COINDESK, function(error, response, body) {
        if (error) {
            throw error;
        }

        var fs = require('fs')
        fs.readFile('/etc/hosts', 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            console.log(data);
        });

        //console.log(body);
        var obj = JSON.parse(body);
        console.log(obj.bpi.USD.rate);
    });
}

function getRipplePrices() {
    getPriceForExchange('XRP', 'BTC').then(function(data) {
        console.log("price of XRP @ BTC: " + data);
        return getPriceForExchange('XRP', 'BITSTAMP');
    }).then(function(data) {
        console.log("price of XRP @ BITSTAMP: " + data);
    });
}

function getPriceForExchange(instrument, exchange, callback) {
    Request.get(eval('XRPExchangeURls.' + exchange), function(error, response, body) {
        if (error) {
            callback(new Error('Error retrieving price: ' + error.message));
        }

        price = parsePriceForMarketPriceResponse(instrument, exchange, body);
        callback(null, price);
    });
};

function parsePriceForMarketPriceResponse(instrument, exchange, body) {
    var obj = JSON.parse(body);

    if (exchange == "COINDESK") {
        return obj.bpi.USD.rate;
    }

    if (exchange == "BTC") {
        return obj.lastPrice;
    }

    if (exchange == "BITSTAMP") {
        return obj.last;
    }
}



ExchangeUrls = {
    BTC : "https://api.btcmarkets.net/market/BTC/AUD/tick",
    COINDESK : "https://api.coindesk.com/v1/bpi/currentprice.json"
};

XRPExchangeURls = {
    BITSTAMP : 'https://www.bitstamp.net/api/v2/ticker/xrpusd/',
    BTC : 'https://api.btcmarkets.net/market/XRP/AUD/tick'
}

var getPriceForExchange = Promise.promisify(getPriceForExchange);
setInterval(getRipplePrices, 5000);