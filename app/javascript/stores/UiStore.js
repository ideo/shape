import _ from 'lodash'
import { observable, action, computed } from 'mobx'

export default class UiStore {
  @observable blankContentToolState = null
  @observable openCardMenuId = false
  @observable organizationMenuOpen = false
  @observable rolesMenuOpen = false
  @observable isTouchDevice = (
    // https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
    ('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0)
  )
  @observable pageMenuOpen = false
  @observable tagsModalOpen = false
  @observable gridSettings = {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  }
  @observable selectedCardIds = []
  @observable isLoading = false

  // default action for updating any basic UiStore value
  @action update(name, value) {
    this[name] = value
  }

  // --- grid properties
  @computed get gridMaxW() {
    const grid = this.gridSettings
    return (grid.gridW * grid.cols) + (grid.gutter * (grid.cols - 1))
  }

  gridWidthFor(cols) {
    const grid = this.gridSettings
    return (grid.gridW * cols) + (grid.gutter * (cols - 1))
  }

  @action updateColumnsToFit(windowWidth) {
    let cols = null
    // shortcut for 4,3,2,1
    _.each(_.range(4, 0), numCols => {
      if (!cols && windowWidth > this.gridWidthFor(numCols)) {
        cols = numCols
        return false
      }
      return true
    })
    if (cols && this.gridSettings.cols !== cols) {
      this.gridSettings.cols = cols
    }
  }
  // --- grid properties />

  // --- BCT + GridCard properties
  @action openBlankContentTool({ order = 0 } = {}) {
    this.blankContentToolState = { order }
  }

  @action closeBlankContentTool() {
    this.blankContentToolState = null
  }

  @action toggleSelectedCardId(cardId) {
    if (this.isSelected(cardId)) {
      this.selectedCardIds.remove(cardId)
    } else {
      this.selectedCardIds.push(cardId)
    }
  }

  isSelected(cardId) {
    if (this.selectedCardIds.length === 0) return false
    return this.selectedCardIds.findIndex(id => id === cardId) > -1
  }
  // --- BCT + GridCard properties />
}
