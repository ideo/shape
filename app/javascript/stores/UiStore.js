import { observable, action } from 'mobx'

export default class UiStore {
  @observable blankContentToolOpen = false
  @observable blankContentToolOrder = null

  @action openBlankContentTool({ order }) {
    this.blankContentToolOpen = true
    this.blankContentToolOrder = order
  }

  @action closeBlankContentTool() {
    this.blankContentToolOpen = false
    this.blankContentToolOrder = null
  }
}
