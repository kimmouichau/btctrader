const Request = require('request');
const Bluebird = request('bluebird');

function getPrice() {
    Request.get(ExchangeUrls.COINDESK, function(error, response, body) {
        if (error) {
            throw error;
        }

        //console.log(body);
        var obj = JSON.parse(body);
        console.log(obj.bpi.USD.rate);
    });
}

function getRipplePrices() {
    console.log('BTC:' + getPriceForExchange('XRP', 'BTC'));
    console.log('BITSTAMP:' + getPriceForExchange('XRP', 'BITSTAMP'));
}

function getPriceForExchange(instrument, exchange) {
    var price;

    Request.get(eval('XRPExchangeURls.' + exchange), function(error, response, body) {
        if (error) {
            throw error;
        }

        //console.log(body);
        price = parsePriceForMarketPriceResponse(instrument, exchange, body);
    });

    return price;
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

setInterval(getRipplePrices, 2000);