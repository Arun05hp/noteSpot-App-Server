var mysql = require("mysql");
var con = mysql.createConnection({
  host: process.env["MYSQL_HOST"],
  user: process.env["MYSQL_USER"],
  password: process.env["MYSQL_PASSWORD"],
  database: process.env["MYSQL_DB"],
});

con.connect((err) => {
  !err ? console.log("Connected! to database") : console.log(err);
});

module.exports = con;
