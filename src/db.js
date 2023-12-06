const sqllite3 = require('sqlite3').verbose();

const db = new sqllite3.Database('./src/db/db.sqlite3',(err)=>{
    if (err) {
        console.log(err.message);
        return;
    }
});


function insertUser(user_id, phone, username) {
    return new Promise((resolve, reject) => {
        db.serialize(function () {
            db.run(`INSERT INTO tbl_users (user_id, phone, username) VALUES (?, ?, ?)`, [user_id, phone, username], function (err) {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                // console.log('user inserted! ');
                resolve();
            });
        });
    });
}

function getUser(user_id) {
    return new Promise((resolve,reject)=>{
        db.serialize(function () {
            db.get(`SELECT * FROM tbl_users WHERE user_id = ?`,[user_id],function (err,row) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(row);
            });
        });
    });
}

function removeUser(user_id) {
    return new Promise((resolve,reject)=>{
        db.serialize(function () {
            db.run(`DELETE FROM tbl_users WHERE user_id = ?`,[user_id],function (err) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve();
            });
        });
    });
}

function insertOrder(user_id, city, destination, type, weight, price, status) {
    return new Promise((resolve, reject) => {
        db.serialize(function () {
            db.run(`INSERT INTO tbl_orders (user_id, city, destination, type, weight, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [user_id, city, destination, type, weight, price, status], function (err) {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                // console.log('order inserted! ');
                resolve(this.lastID); // Return the inserted ID
            });
        });
    });
}

async function getOrders(user_id) {
    return new Promise((resolve,reject)=>{
        db.serialize(function () {
            db.all(`SELECT * FROM tbl_orders WHERE user_id = ? and status <> 'archived'`,[user_id],function (err,rows) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(rows);
            });
        });
    });
}

async function getOrderDetails(orderId) {
    return new Promise((resolve,reject)=>{
        db.serialize(function () {
            db.get(`SELECT * FROM tbl_orders WHERE id = ?`,[orderId],function (err,row) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(row);
            });
        });
    });
}

async function deleteOrder(orderId) {
    return new Promise((resolve,reject)=>{
        db.serialize(function () {
            db.run(`DELETE FROM tbl_orders WHERE id = ?`,[orderId],function (err) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(this.changes); // Return the number of affected rows
            });
        });
    });
}

async function  updateOrderStatus(orderId, status) {
    return new Promise((resolve,reject)=>{
        db.serialize(function () {
            db.run(`UPDATE tbl_orders SET status = ? WHERE id = ?`,[status, orderId],function (err) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(this.changes); // Return the number of affected rows
            });
        });
    });
}
async function getUserDraftOrdersCount(user_id) {
    return new Promise((resolve,reject)=>{
        db.serialize(function () {
            db.get(`SELECT count(*) as count FROM tbl_orders WHERE user_id = ? and status = 'draft'`,[user_id],function (err,row) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(row.count);
            });
        });
    });
}



exports.insertUser = insertUser;
exports.insertOrder = insertOrder;
exports.getUser = getUser;
exports.removeUser = removeUser;
exports.getOrders = getOrders;
exports.getOrderDetails = getOrderDetails;
exports.deleteOrder = deleteOrder;
exports.updateOrderStatus = updateOrderStatus;
exports.getUserDraftOrdersCount = getUserDraftOrdersCount;
