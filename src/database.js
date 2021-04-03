const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/newpaper-db-app', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(db => console.log('db conected')).
catch(err => console.log(err));