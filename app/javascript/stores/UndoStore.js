import _ from 'lodash'
import { observable, action } from 'mobx'
import { routingStore, uiStore } from '~/stores'
import sleep from '~/utils/sleep'

const MAX_UNDOSTACK_LENGTH = 10

export default class UndoStore {
  @observable
  stack = []

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
    const { message } = undoAction
    uiStore.popupSnackbar({ message })
    this.currentlyUndoing = true
    if (undoAction.redirectPath) {
      const { type, id } = undoAction.redirectPath
      const { viewingRecord } = uiStore
      // check if we don't have to redirect
      if (viewingRecord.internalType !== type || viewingRecord.id !== id) {
        routingStore.routeTo(type, id)
        // wait a little bit so that we actually route to the next page
        await sleep(350)
      }
    }
    await undoAction.apiCall()
    this.currentlyUndoing = false
  }

  captureUndoKeypress = e => {
    if (e.code === 'KeyZ' && (e.metaKey || e.ctrlKey)) {
      if (this.currentlyUndoing) return false
      if (uiStore.cancelUndo) return false
      const { activeElement } = document
      if (activeElement.nodeName === 'INPUT') return false
      if (
        _.intersection(activeElement.classList, [
          'ql-editor',
          'public-DraftEditor-content',
        ]).length > 0
      ) {
        return false
      }
      this.undoLastAction()
    }
    return false
  }
}
