var fs = require('fs');

var injectPrices = function injectPrices(filename) {
    var contents = fs.readFileSync(filename, 'utf-8');
    var dayObj = JSON.parse(contents);
    return dayObj;
};

//var obj = injectPrices();
//console.log(obj);

module.exports = {
    injectPrices: injectPrices
};