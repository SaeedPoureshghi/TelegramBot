const sqllite3 = require('sqlite3').verbose();
const db = new sqllite3.Database('./src/db/db.sqlite3',(err)=>{

    if (err) {
        console.log(err.message);
        return;
    }
    console.log('connected to db');

}
);

db.serialize(function () {
    db.run(`CREATE TABLE IF NOT EXISTS tbl_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        phone TEXT,
        username TEXT
    )`,function (err) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('tbl_users created! ');

    });

    db.run(`CREATE TABLE IF NOT EXISTS tbl_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        city TEXT,
        destination TEXT,
        type TEXT,
        weight TEXT,
        price TEXT,
        status TEXT
    )`,function (err) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('tbl_orders created! ');

    })
  });

  db.close();