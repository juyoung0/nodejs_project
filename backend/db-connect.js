var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'askhub-datalab.cj3x64xxqok0.ap-northeast-2.rds.amazonaws.com',
    port: 3306,
    user: 'askhub',
    password: 'ASKhub12#',
    database: 'askhub'
});

module.exports = connection;
