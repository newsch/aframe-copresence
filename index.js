var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/client.js', function(req, res) {
    res.sendFile(__dirname + '/client.js');
});

io.on('connection', function(socket){
    console.log(`visitor connected: ${socket.id} (${socket.handshake.address})`);
    socket.on('update-pos', (pos) => {
        // console.log(pos);
        socket.volatile.broadcast.emit('visitor-update-pos', {id: socket.id, ...pos});
    })
    socket.on('update-data'), (data) => {
        socket.broadcast.emit('visitor-update-data', {id: socket.id, data});
    }
    socket.on('disconnect', function() {
        socket.broadcast.emit('visitor-disconnect', {id: socket.id});
        console.log(`visitor disconnected: ${socket.id} (${socket.handshake.address})`);
    });
});

http.listen(PORT, function(){
    console.log(`listening on *:${PORT}`);
});
