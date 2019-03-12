var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require('passport');
const passportJwt = require('passport-jwt');
let mysqlFunc = require('./mysqlFunctions');

var app = express();

var whitelist = ['http://localhost:8080', 'http://localhost:3000'];
var corsOptions = {
    origin: function (origin, callback) {
        if (origin === undefined || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            console.log(origin);
            callback(new Error('Not allowed by CORS'))
        }
    }
};

var JwtStrategy = passportJwt.Strategy,
    ExtractJwt = passportJwt.ExtractJwt;
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'fkosi8JUTRTU!$@^7346';
passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    try {
        let results = await mysqlFunc.query('SELECT * FROM users WHERE user_id=?', [jwt_payload.id]);
        if (results && results.length === 1) {
            return done(null, results[0]);
        } else {
            return done(null, false);
        }
    } catch (err) {
        return done(err, false);
    }
}));

app.use(cors(corsOptions));
app.use(fileUpload());
/*
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
*/
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
