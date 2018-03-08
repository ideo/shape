import { observable, action } from 'mobx'

export default class UiStore {
  @observable blankContentToolState = null
  @observable openCardMenuId = false
  @observable gridSettings = {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  }

  @action openBlankContentTool({ order = 0 } = {}) {
    this.blankContentToolState = { order }
  }

  @action closeBlankContentTool() {
    this.blankContentToolState = null
  }

  @action openCardMenu(cardId) {
    this.openCardMenuId = cardId
  }
}
