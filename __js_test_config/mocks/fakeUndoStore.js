const fakeUndoStore = {
  pushUndoAction: jest.fn(),
  undoLastAction: jest.fn(),
  captureUndoKeypress: jest.fn(),
}

export default fakeUndoStore
