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

var clients = new Map();

io.on('connection', function(socket){
    console.log(`visitor connected: ${socket.id} (${socket.handshake.address})`);
    clients.forEach((client, id) => {
        socket.emit('visitor-update-pos', {id, position: client.position, rotation: client.rotation});
        socket.emit('visitor-update-data', {id, data: client.data});
    });
    socket.emit('visitor-list', clients);
    // Now add self to clients
    let me = {id: socket.id, position: {x: 0, y: 0, z: 0}, rotation: {x: 0, y: 0, z: 0}, data: {}};
    clients.set(socket.id, me);

    socket.on('update-pos', (pos) => {
        // console.log(pos);
        socket.volatile.broadcast.emit('visitor-update-pos', {id: socket.id, ...pos});
        let client = clients.get(socket.id);
        client.position = pos.position;
        client.rotation = pos.rotation;
    })
    socket.on('update-data', (data) => {
        socket.broadcast.emit('visitor-update-data', {id: socket.id, data});
        let client = clients.get(socket.id);
        client.data = {...client.data, ...data};
    });
    socket.on('disconnect', function() {
        socket.broadcast.emit('visitor-disconnect', {id: socket.id});
        console.log(`visitor disconnected: ${socket.id} (${socket.handshake.address})`);
        clients.delete(socket.id);
    });
});

http.listen(PORT, function(){
    console.log(`listening on *:${PORT}`);
});
