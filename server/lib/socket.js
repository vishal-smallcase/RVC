const io = require('socket.io');
const users = require('./users');
const firebase = require('firebase');

const config = {
  
};

const database = firebase.initializeApp(config).database();

/**
 * Initialize when a connection is made
 * @param {SocketIO.Socket} socket
 */
function initSocket(socket) {
  let id;
  socket
    .on('init', async (myId) => {
      id = await users.create(socket, myId);
      console.log(id, '----------------------connected');
      socket.emit('init', { id });
    })
    .on('request', (data) => {
      const receiver = users.get(data.to);
      if(!id || !users.get(id)) {
        socket.emit('reload');
      }
      else if (receiver) {
        receiver.emit('request', { ...data, from: id });
      } else socket.emit('end');
    })
    .on('call', (data) => {
      const receiver = users.get(data.to);
      if (receiver) {
        receiver.emit('call', { ...data, from: id });
      } else {
        console.log('failed...........');
        console.log(data.to);
        socket.emit('failed');
      }
    })
    .on('reconnect', async () => {
      id = await users.create(socket);
      console.log('reconnect--------', id);
      socket.emit('reconnect', {id});
    })
    .on('rehandshake', (data) => {
      const callId = data.callId;
      database.ref('calls/'+callId).once('value', snap => {
        const call = snap.val();
        console.log(call);
        const user1 = call.user1;
        const user2 = call.user2;
        let receiver = null;
        if(id === user1) {
          receiver = users.get(user2);
        } else {
          receiver = users.get(user1);
        }
        if (receiver) {
          receiver.emit('call', { ...data, from: id });
        } else {
          console.log('failed...........');
          socket.emit('failed');
        }
      })
    })
    .on('end', (data) => {
      const receiver = users.get(data.to);
      if (receiver) {
        receiver.emit('end');
      }
    })
    .on('disconnect', () => {
      users.remove(id);
      console.log(id, 'disconnected');
    });
}

module.exports = (server) => {
  io
    .listen(server, { log: true })
    .on('connection', initSocket);
};
