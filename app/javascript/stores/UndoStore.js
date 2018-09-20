import _ from 'lodash'
import { observable, action } from 'mobx'
import { routingStore, uiStore } from '~/stores'

export default class UndoStore {
  @observable
  stack = []

  // block multiple requests from happening too quickly
  @observable
  currentlyUndoing = false

  @action
  pushUndoAction({ apiCall, redirectPath = null, message = '' }) {
    this.stack.push({ apiCall, redirectPath, message })
  }

  @action
  async undoLastAction() {
    const undoAction = this.stack.pop()
    if (!undoAction) return
    console.log('<UNDO>', undoAction.message)
    this.currentlyUndoing = true
    await undoAction.apiCall()
    if (undoAction.redirectPath) {
      const { type, id } = undoAction.redirectPath
      // const { viewingRecord } = uiStore
      // // check if we don't have to redirect
      // console.log(viewingRecord.internalType, viewingRecord.id, type, id)
      routingStore.routeTo(type, id)
    }
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
