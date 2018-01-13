var mysql      = require('mysql');
var injester   = require('./price_injester.js');

var pricesObj = injester.injectPrices('c:/temp/btc_prices_by_hour.json');
//console.log(pricesObj);


var connection = mysql.createConnection({
    host     : 'testinstance.cunjbzflwv9t.ap-southeast-2.rds.amazonaws.com',
    user     : 'x',
    password : 'x',
    database : 'price'
});

connection.connect();

pricesObj.ticks.forEach(function(price) {

    var sql = "INSERT INTO price_hour values('BTC', " + price[0] + ", " + price[1] + ", " + price[2] + ", " + price[3] + ", " + price[4] + ", " + price[5] + ");";
    console.log(sql);

    connection.query(sql, function (error, results, fields) {
        if (error) throw error;
        console.log('1 record inserted');
    });
});

connection.query('SELECT count(*) from price', function (error, results, fields) {
    if (error) throw error;
    console.log('The solution is: ', results);
});

connection.end();