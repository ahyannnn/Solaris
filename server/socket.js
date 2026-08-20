// backend/socket.js

let io = null;

// Set the Socket.IO instance
const setIO = (socketIO) => {
  io = socketIO;
};

// Get the Socket.IO instance
const getIO = () => {
  return io;
};

module.exports = {
  setIO,
  getIO,
};