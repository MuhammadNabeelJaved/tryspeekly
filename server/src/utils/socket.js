let _io = null

export const setIO = (io) => { _io = io }
export const getIO = () => _io

export const emitToUser = (userId, event, data) => {
  if (_io && userId) {
    _io.to(`user:${userId.toString()}`).emit(event, data)
  }
}
