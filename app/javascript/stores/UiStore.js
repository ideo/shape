import _ from 'lodash'
import { observable, action, computed } from 'mobx'

export default class UiStore {
  @observable blankContentToolState = null
  @observable openCardMenuId = false
  @observable organizationMenuOpen = false
  @observable editingObjectName = false
  @observable rolesMenuOpen = false
  @observable gridSettings = {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  }
  @observable isLoading = false

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

  @action loading(val) {
    this.isLoading = val
  }

  @action closeOrganizationMenu() {
    if (this.organizationMenuOpen) {
      this.organizationMenuOpen = false
    }
  }

  @action stopEditingObjectName() {
    if (this.editingObjectName) {
      this.editingObjectName = false
    }
  }

  @action startEditingObjectName() {
    this.editingObjectName = true
  }

  @action openRolesMenu() {
    this.rolesMenuOpen = true
  }

  @action closeRolesMenu() {
    this.rolesMenuOpen = false
  }
}
