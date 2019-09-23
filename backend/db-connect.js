var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'secret.com',
    port: 1111,
    user: 'secret',
    password: 'secret',
    database: 'secret'
});

module.exports = connection;
