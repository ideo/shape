const fakeUndoStore = {
  pushUndoAction: jest.fn(),
  undoLastAction: jest.fn(),
  captureUndoKeypress: jest.fn(),
  performActionAfterRoute: jest.fn(),
}

export default fakeUndoStore
