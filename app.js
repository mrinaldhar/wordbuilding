var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http)
var Flickr = require("flickrapi"),
    flickrOptions = {
      api_key: "86f8a2aedd5fae483f4ff847edbd43e9",
      secret: "dff1851d65bf771c"
    };


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var usernames = {};
var numUsers = 0;
var imgres;
io.sockets.on('connection', function(socket) {
    var addedUser = false;

    console.log('A client connected.');
    socket.on('disconnect', function() {
      console.log(socket.username+' has disconnected.');
      if (addedUser) {
      delete usernames[socket.id];
      --numUsers;
      io.emit('updatelist', usernames);
      io.emit('gameover', socket.id);
      }
      });
    socket.on('add user', function(username) {

      socket.username = username;
      usernames[socket.id]=username;
      ++numUsers;

      addedUser = true;
      io.emit('updatelist', usernames);
      console.log('User: '+username+'. Total connected: '+numUsers);
      }); 
    socket.on('asktoplay', function(data) {
      var to = data.to;
      var from = data.from;
      var fname = usernames[from];
      // console.log(data.);
      io.sockets.connected[to].emit('asktoplay', {fname: fname, fid: from});
    });
    socket.on('perm_granted', function(data) {
      var to = data.to;
      // console.log(io.sockets.connected[to]);
      io.sockets.connected[to].emit('perm_granted', {fromid: data.from, fromname: socket.username});
    });
    socket.on('turnover', function(data) {
      var to = data.to;

       Flickr.tokenOnly(flickrOptions, function(error, flickr) {
  
   flickr.photos.search({
       page: 1,
     per_page: 80,
       tags: data.val,
       in_gallery: 1
      }, function(err, result) {
       // console.log(result);
       imgres = result;
      });

      });

      io.sockets.connected[to].emit('turnover', {to:data.to, val: data.val, imgres: imgres});
      io.sockets.connected[data.from].emit('picchange', {imgres: imgres});
    });
    socket.on('gameover', function(data) {
      var to = data.to;
      io.sockets.connected[to].emit('gameover', to);
    });
    });

http.listen(3000, function() {
    console.log('Listening on 3000');
    });