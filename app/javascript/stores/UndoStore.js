import { observable, action, computed } from 'mobx'
import { UNDO_ACTION_STATUS } from '~/enums/actionEnums'
const MAX_UNDOSTACK_LENGTH = 10

export default class UndoStore {
  @observable
  undoStack = []
  @observable
  redoStack = []

  @observable
  actionAfterRoute = null

  @observable
  actionStatus = UNDO_ACTION_STATUS.IDLE

  get uiStore() {
    return this.apiStore.uiStore
  }

  get routingStore() {
    return this.apiStore.routingStore
  }

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
    this.performAction(undoAction)
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
    this.performAction(redoAction)
  }

  @action
  async performAfterRedirect(redirectPath, action) {
    const { type, id } = redirectPath
    const { viewingRecord } = this.uiStore
    const { internalType, id: recordId } = viewingRecord
    // check if we don't have to redirect
    if (!!type && !!id && (internalType !== type || recordId !== id)) {
      this.routingStore.routeTo(type, id)
      this.actionAfterRoute = action
    } else {
      this.performAction(action)
    }
  }

  @action
  async performAction(action) {
    const {
      message,
      redoAction,
      redirectPath,
      redoRedirectPath,
      actionType,
    } = action
    if (redoAction) {
      // undo actions should usually have a redoAction
      this.pushRedoAction({
        ...redoAction,
        redirectPath: redoRedirectPath || redirectPath,
        actionType,
      })
    }
    this.uiStore.performPopupAction(message, actionType)
    await action.apiCall()
    this.status = UNDO_ACTION_STATUS.IDLE
  }

  @action
  performActionAfterRoute() {
    const action = this.actionAfterRoute
    this.actionAfterRoute = null
    return this.performAction(action)
  }

  handleUndoKeypress = () => {
    if (this.currentlyUndoing) return false
    if (this.uiStore.cancelUndo) return false
    return this.undoLastAction()
  }

  handleRedoKeyPress = () => {
    if (this.currentlyRedoing) return false
    if (this.uiStore.cancelRedo) return false
    return this.redoLastAction()
  }
}
