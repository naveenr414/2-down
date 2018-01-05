var app = require('express')();
var express = require("express");
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use('/', express.static(__dirname + '/'));

io.on('connection', function(socket){	
	socket.on('entered', function(msg){
		console.log(msg);
		io.emit('entered',msg);
	}); 
	
	socket.on('request', function(msg){
		var location = 'nyt/2011/'+msg+".json";
		console.log("Reading from "+location);
		
		fs.readFile(location, 'utf8', function(err, contents) {
			data = JSON.parse(contents);
			console.log("Data "+data);
			socket.emit('metadata',data);
		});
		
	});
});



http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
