import { observable, action } from 'mobx'

export default class UiStore {
  @observable blankContentToolState = null

  @action openBlankContentTool({ order }) {
    this.blankContentToolState = { order }
  }

  @action closeBlankContentTool() {
    this.blankContentToolState = null
  }
}
