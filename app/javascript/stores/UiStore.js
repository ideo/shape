import { observable, action } from 'mobx'

export default class UiStore {
  @observable blankContentToolState = null
  @observable openCardMenu = null
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

  @action cardMenuOpened(cardMenu) {
    this.closeCardMenuIfOpen(cardMenu)
    this.openCardMenu = cardMenu
  }

  @action closeCardMenuIfOpen(ignoreCardMenu = null) {
    if (!this.openCardMenu) return

    // Close the open menu if it is not the same menu
    if (!ignoreCardMenu || (this.openCardMenu.cardId !== ignoreCardMenu.cardId)) {
      this.openCardMenu.setOpen(false)
      this.openCardMenu = null
    }
  }
}
