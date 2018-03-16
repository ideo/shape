import _ from 'lodash'
import { observable, action } from 'mobx'

export default class UiStore {
  @observable blankContentToolState = null
  @observable openCardMenuId = false
  @observable organizationMenuOpen = false
  @observable rolesMenuOpen = false
  @observable gridSettings = {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  }

  gridWidthFor(cols) {
    const grid = this.gridSettings
    return (grid.gridW * cols) + (grid.gutter * (cols - 1))
  }

  @action updateColumnsToFit(windowWidth) {
    let cols = null
    console.log('ww', windowWidth)
    // shortcut for 4,3,2,1
    _.each(_.range(4, 0), numCols => {
      if (!cols && windowWidth > this.gridWidthFor(numCols)) {
        cols = numCols
        return false
      }
      return true
    })
    console.log(cols)
    if (cols && this.gridSettings.cols !== cols) {
      this.gridSettings.cols = cols
    }
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

  @action openOrganizationMenu() {
    if (!this.organizationMenuOpen) {
      this.organizationMenuOpen = true
    }
  }

  @action closeOrganizationMenu() {
    if (this.organizationMenuOpen) {
      this.organizationMenuOpen = false
    }
  }

  @action openRolesMenu() {
    this.rolesMenuOpen = true
  }

  @action closeRolesMenu() {
    this.rolesMenuOpen = false
  }
}
