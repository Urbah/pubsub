const mongoose = require('mongoose');

const URL = 'mongodb://localhost/newpaper-db-app'

class Database {
    connect() {
        return new Promise((resolve, reject) => {
            mongoose.connect(URL, {
                useCreateIndex: true,
                useNewUrlParser: true,
                useFindAndModify: false,
                useUnifiedTopology: true
            }, (err, db) => {
                return err ? reject(err) : resolve(db);
            })
        })
    }
}

module.exports = Database
