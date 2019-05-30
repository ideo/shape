import { observable, action } from 'mobx'
import { routingStore, uiStore } from '~/stores'

const MAX_UNDOSTACK_LENGTH = 10

export default class UndoStore {
  @observable
  stack = []
  @observable
  undoAfterRoute = null

  // block multiple requests from happening too quickly
  @observable
  currentlyUndoing = false

  @action
  pushUndoAction({ apiCall, redirectPath = null, message = '' }) {
    this.stack.push({ apiCall, redirectPath, message })
    if (this.stack.length > MAX_UNDOSTACK_LENGTH) {
      // only keep 10 items at a time
      this.stack.shift()
    }
  }

  @action
  async undoLastAction() {
    const undoAction = this.stack.pop()
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
  async performUndo(undoAction) {
    const { message } = undoAction
    uiStore.popupSnackbar({ message })
    await undoAction.apiCall()
    this.currentlyUndoing = false
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
}
