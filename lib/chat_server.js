var socketio = require('socket.io');
var io;
var guestNumber =1;
var nickName;
var nameUsed = [];
var currentRoom;

exports.listen = function(server) {
  io = socketio.listen(server);

  io.set('log level', 1);
  io.sockets.on('connection', function (socket) {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
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

function assignGuestName(socket, guestNumber, nickname, nameUsed) {
  var name = 'Guest' + guestNumber;
  nickname[socket.id] = name;
  socket.emit('nameResult', {
    success:true,
    name:name
  });
  nameUsed.push(name);
  return guestNumber +1;
}

function joinRoom(socket, room) {
  socket.join(room);

  currentRoom[socket.id] = room;

  socket.emit('joinResult', {room: room});

  socket.broadcast.to(room).emit('message', {
    text:nickNames[socket.id]+ 'has joind' + room + '.'
  });

  var usersInRoom = io.sockets.clients(room);

  if (usersInroom.length > 1) {
    var usersInroomSummary = 'Users currently in ' + room + ':';
    for (var index in usersInRoom) {
      var usersSocketId = usersInRoom[index].id;
      if (usersSocketId != socket.id) {
        if (index > 0) {
          usersInroomSummary += ',';
        }
          usersInroomSummary += nickNames[usersSocketId];
      }
    }
    usersInroomSummary += ',';
    socket.emit('message', {test:usersInroomSummary});
  }
}

function handleNameChangeAttempts(socket, nickNames, nameUsed) {
  socket.on('nameAttempt', function(name){
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest."'
      });
    }else{
      if (nameUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = nameUsed.indexOf(previousName);
        nameUsed.push(name);
        nickNames[socket.id] = name;
        delete nameUsed[previousNameIndex];

        socket.emit('nameResult', {
          success: true,
          name: name
        });

        socket.broadcast.to(currentRoom[socket.id]).emit('message',{
          test: previousName + ' in now known as' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  });
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function (message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ':' + message.text
    });
  });
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete nameUsed[nameIndex];
    delete nickNames[socket.id];
  });
}