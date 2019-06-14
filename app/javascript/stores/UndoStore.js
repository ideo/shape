import { observable, action, computed } from 'mobx'
import { routingStore, uiStore } from '~/stores'
import { UndoActionStatus } from '~/enums/actionEnums'
const MAX_UNDOSTACK_LENGTH = 10

export default class UndoStore {
  @observable
  undoStack = []
  @observable
  redoStack = []

  @observable
  undoAfterRoute = null

  @observable
  actionStatus = UndoActionStatus.idle

  // block multiple requests from happening too quickly
  @computed
  get currentlyUndoing() {
    return this.actionStatus === UndoActionStatus.undo
  }

  @computed
  get currentlyRedoing() {
    return this.actionStatus === UndoActionStatus.redo
  }

  @computed
  get currentlyIdle() {
    return this.actionStatus === UndoActionStatus.idle
  }

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
    this.status = UndoActionStatus.undo
    const { redirectPath } = undoAction
    if (redirectPath) {
      this.redirectAction(redirectPath, undoAction)
    }
    this.performUndo(undoAction)
  }

  @action
  async redoLastAction() {
    const redoAction = this.redoStack.pop()
    if (!redoAction) return
    this.status = UndoActionStatus.redo
    const { redirectPath } = redoAction
    if (redirectPath) {
      this.redirectAction(redirectPath, redoAction)
    }
    this.performRedo(redoAction)
  }

  @action
  async redirectAction(redirectPath, action) {
    const { type, id } = redirectPath
    const { viewingRecord } = uiStore
    const { internalType, id: recordId } = viewingRecord
    // check if we don't have to redirect
    if (internalType !== type || recordId !== id) {
      routingStore.routeTo(type, id)
      this.undoAfterRoute = action
    }
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
    this.status = UndoActionStatus.idle
  }

  @action
  async performRedo(redoAction) {
    const { message } = redoAction
    uiStore.popupSnackbar({ message })
    await redoAction.apiCall()
    this.status = UndoActionStatus.idle
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
