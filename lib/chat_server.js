var socketio = require('socket.io');
var io;
var guestNumber =1;
var nickName;
var nameUsed = [];
var currentRoom;

export.listen = function(server) {
  io = socket,listen(server);

  io.set('log level', 1);
  io.socketon('connection', function (socket) {
    guestNumber = assignGuestName(socket, guestNumber,
      ?nickName, nameUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickName);
    handleNameChangeAttempts(socket, nickName, nameUsed);
    handleRoomJoining(socket);

    socket.on('rooms', function(){
      socket.emit('rooms', io.socket.manager.rooms);
    });
    handleClientDisconnection(socket, nickName, nameUsed);
  });
};

function assignGuestName(socket, guestNumber, nickname. nameUsed) {
  var name = 'Guest' + guestNumber;
  nickname[socket.id] = name;
  socket.emit('nameResult', {
    success:true,
    name:name
  });
  nameUsed.push(name);
  return guestNumber +1;
}