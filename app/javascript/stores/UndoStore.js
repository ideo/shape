import { observable, action, computed } from 'mobx'
import { routingStore, uiStore } from '~/stores'
import { UNDO_ACTION_STATUS } from '~/enums/actionEnums'
const MAX_UNDOSTACK_LENGTH = 10

export default class UndoStore {
  @observable
  undoStack = []
  @observable
  redoStack = []

  @observable
  undoAfterRoute = null

  @observable
  actionStatus = UNDO_ACTION_STATUS.IDLE

  // block multiple requests from happening too quickly
  @computed
  get currentlyUndoing() {
    return this.actionStatus === UNDO_ACTION_STATUS.UNDO
  }

  @computed
  get currentlyRedoing() {
    return this.actionStatus === UNDO_ACTION_STATUS.REDO
  }

  @computed
  get currentlyIdle() {
    return this.actionStatus === UNDO_ACTION_STATUS.IDLE
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
    this.status = UNDO_ACTION_STATUS.UNDO
    const { redirectPath } = undoAction
    if (redirectPath) {
      this.performAfterRedirect(redirectPath, undoAction)
      return
    }
    this.performUndo(undoAction)
  }

  @action
  async redoLastAction() {
    const redoAction = this.redoStack.pop()
    if (!redoAction) return
    this.status = UNDO_ACTION_STATUS.REDO
    const { redirectPath } = redoAction
    if (redirectPath) {
      this.performAfterRedirect(redirectPath, redoAction)
      return
    }
    this.performRedo(redoAction)
  }

  @action
  async performAfterRedirect(redirectPath, action) {
    const { type, id } = redirectPath
    const { viewingRecord } = uiStore
    const { internalType, id: recordId } = viewingRecord
    // check if we don't have to redirect
    if (!!type && !!id && (internalType !== type || recordId !== id)) {
      routingStore.routeTo(type, id)
      this.undoAfterRoute = action
    } else {
      this.performUndo(action)
    }
  }

  @action
  async performUndo(undoAction) {
    const { message, redoAction, redirectPath, actionType } = undoAction
    if (redoAction) {
      // there should usually always be a redoAction...
      // however TextItemCover has a unique way of undo/redo
      this.pushRedoAction({
        ...redoAction,
        redirectPath,
        actionType,
      })
    }
    uiStore.performPopupAction(message, actionType)
    await undoAction.apiCall()
    this.status = UNDO_ACTION_STATUS.IDLE
  }

  @action
  async performRedo(redoAction) {
    const { message, actionType } = redoAction
    uiStore.performPopupAction(message, actionType)
    await redoAction.apiCall()
    this.status = UNDO_ACTION_STATUS.IDLE
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
