import { observable, action } from 'mobx'
import { routingStore } from '~/stores'

export default class UndoStore {
  @observable
  stack = []

  @action
  pushUndoAction({ apiCall, redirectPath = null, message = '' }) {
    this.stack.push({ apiCall, redirectPath })
  }

  @action
  async undoLastAction() {
    const undoAction = this.stack.pop()
    console.log(undoAction)
    await undoAction.apiCall()
    if (undoAction.redirectPath) {
      const { type, id } = undoAction.redirectPath
      routingStore.routeTo(type, id)
    }
  }
}
