var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('update-pos', (pos) => {
        // console.log(pos);
        socket.volatile.broadcast.emit('visitor-update-pos', {id: socket.id, ...pos});
    })
    socket.on('disconnect', function() {
        socket.broadcast.emit('visitor-disconnect', {id: socket.id});
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});