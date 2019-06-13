import { observable, action } from 'mobx'
import { routingStore, uiStore } from '~/stores'

const MAX_UNDOSTACK_LENGTH = 10

export default class UndoStore {
  @observable
  undoStack = []
  @observable
  redoStack = []

  @observable
  undoAfterRoute = null

  // block multiple requests from happening too quickly
  @observable
  currentlyUndoing = false
  @observable
  currentlyRedoing = false

  @action
  pushUndoAction(undoAction) {
    this.undoStack.push(undoAction)
    if (this.undoStack.length > MAX_UNDOSTACK_LENGTH) {
      // only keep 10 items at a time
      this.undoStack.shift()
    }
  }

  @action
  pushRedoAction(redoAction) {
    this.redoStack.push(redoAction)
    if (this.redoStack.length > MAX_UNDOSTACK_LENGTH) {
      // only keep 10 items at a time
      this.redoStack.shift()
    }
  }

  @action
  async undoLastAction() {
    const undoAction = this.undoStack.pop()
    if (!undoAction) return
    this.currentlyUndoing = true
    if (undoAction.redirectPath) {
      const { type, id } = undoAction.redirectPath
      const { viewingRecord } = uiStore
      // check if we don't have to redirect
      if (viewingRecord.internalType !== type || viewingRecord.id !== id) {
        routingStore.routeTo(type, id)
        this.undoAfterRoute = undoAction
        return
      }
    }
    this.performUndo(undoAction)
  }

  @action
  async redoLastAction() {
    const redoAction = this.redoStack.pop()
    if (!redoAction) return
    this.currentlyRedoing = true
    if (redoAction.redirectPath) {
      const { type, id } = redoAction.redirectPath
      const { viewingRecord } = uiStore
      // check if we don't have to redirect
      if (viewingRecord.internalType !== type || viewingRecord.id !== id) {
        routingStore.routeTo(type, id)
        this.undoAfterRoute = redoAction
        return
      }
    }
    this.performRedo(redoAction)
  }

  @action
  async performUndo(undoAction) {
    const { message, redoAction, redirectPath } = undoAction
    this.redoStack.push({
      ...redoAction,
      redirectPath: redirectPath,
    })
    uiStore.popupSnackbar({ message })
    await undoAction.apiCall()
    this.currentlyUndoing = false
  }

  @action
  async performRedo(redoAction) {
    const { message } = redoAction
    uiStore.popupSnackbar({ message })
    await redoAction.apiCall()
    this.currentlyRedoing = false
  }

  @action
  performUndoAfterRoute() {
    const undoAction = this.undoAfterRoute
    this.undoAfterRoute = null
    return this.performUndo(undoAction)
  }

  handleUndoKeypress = () => {
    if (this.currentlyUndoing) return false
    if (uiStore.cancelUndo) return false
    return this.undoLastAction()
  }

  handleRedoKeyPress = () => {
    if (this.currentlyRedoing) return false
    if (uiStore.cancelRedo) return false
    return this.redoLastAction()
  }
}
