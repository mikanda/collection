
/**
 * Module dependencies.
 */

var express = require('express');

/**
 * Module exports.
 */

var app = module.exports = express();
app.set('view engine', 'jade');
app.set('views', __dirname);

// static file server
app.use(express.static(__dirname));
app.use(function(req, res, next){
  var fs = require('fs')
    , Builder = require('component-builder');
  var builder = new Builder('.');
  builder.development();
  builder.copyAssetsTo(__dirname);
  builder.build(function(err, res){
    if (err) return next(err);
    fs.writeFileSync(__dirname + '/build.js', res.require + res.js);
    fs.writeFileSync(__dirname + '/build.css', res.css);
    next();
  });
});
app.get('/', function(req, res){
  res.render('index');
});
