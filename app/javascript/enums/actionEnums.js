const UndoActionStatus = Object.freeze({
  IDLE: Symbol('idle'),
  UNDO: Symbol('undo'),
  REDO: Symbol('redo'),
})

export { UndoActionStatus }
