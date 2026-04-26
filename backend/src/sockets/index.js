




const emitSocketEvents = (req , roomId , event , payload) =>{

    req.app.get('io').in(roomId).emit(event , payload)
}



export {emitSocketEvents}