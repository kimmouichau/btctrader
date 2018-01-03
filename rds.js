var mysql      = require('mysql');

var connection = mysql.createConnection({
    host     : 'testinstance.cunjbzflwv9t.ap-southeast-2.rds.amazonaws.com',
    user     : 'x',
    password : 'x',
    database : 'price'
});

connection.connect();

connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    if (error) throw error;
    console.log('The solution is: ', results[0].solution);
});

connection.end();