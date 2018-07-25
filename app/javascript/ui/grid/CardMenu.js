import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import PopoutMenu from '~/ui/global/PopoutMenu'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import DownloadIcon from '~/ui/icons/DownloadIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import ReplaceIcon from '~/ui/icons/ReplaceIcon'
import MoveIcon from '~/ui/icons/MoveIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import AddIntoIcon from '~/ui/icons/AddIntoIcon'

@inject('uiStore')
@observer
class CardMenu extends React.Component {
  @observable itemLoading = ''

  get cardId() {
    return this.props.card.id
  }

  @action setLoading(name = '') {
    this.itemLoading = name
  }

  callCardAction = async(name, methodName) => {
    const { uiStore, card } = this.props
    uiStore.closeMoveMenu()
    this.setLoading(name)
    await card[methodName]()
    this.setLoading()
  }

  replaceCard = () => {
    this.props.uiStore.closeMoveMenu()
    const { card } = this.props
    card.beginReplacing()
  }

  openMoveMenu = cardAction => {
    const { card, uiStore } = this.props
    uiStore.selectCardId(card.id)
    uiStore.openMoveMenu({ from: this.viewingCollectionId, cardAction })
  }

  duplicateCard = () => {
    this.openMoveMenu('duplicate')
  }

  moveCard = () => {
    this.openMoveMenu('move')
  }

  linkCard = () => {
    this.openMoveMenu('link')
  }

  addToMyCollection = () => {
    this.callCardAction('Add to My Collection', 'API_linkToMyCollection')
  }

  archiveCard = () => {
    this.callCardAction('Archive', 'API_archive')
  }

  downloadCard = () => {
    const { card } = this.props
    const { record } = card
    if (record.filestack_file) {
      window.open(record.filestack_file.url, '_blank')
    }
  }

  handleMouseLeave = () => {
    if (this.props.menuOpen) {
      this.props.uiStore.update('openCardMenuId', false)
    }
  }

  toggleOpen = (e) => {
    e.stopPropagation()
    const { uiStore } = this.props
    if (this.props.menuOpen) {
      uiStore.update('openCardMenuId', false)
    } else {
      uiStore.update('openCardMenuId', this.cardId)
    }
  }

  // Viewing collection could be null if on the search page
  get viewingCollectionId() {
    const { card, uiStore } = this.props
    return uiStore.viewingCollection
      ? uiStore.viewingCollection.id
      : card.parent_id
  }

  get menuItems() {
    const { canEdit, card, canReplace, uiStore } = this.props

    let items = []
    const actions = [
      { name: 'Duplicate', iconRight: <DuplicateIcon />, onClick: this.duplicateCard },
      { name: 'Move', iconRight: <MoveIcon />, onClick: this.moveCard },
      { name: 'Link', iconRight: <LinkIcon />, onClick: this.linkCard },
      { name: 'Add to My Collection', iconRight: <AddIntoIcon />, onClick: this.addToMyCollection },
      { name: 'Archive', iconRight: <ArchiveIcon />, onClick: this.archiveCard },
      { name: 'Download', iconRight: <DownloadIcon />, onClick: this.downloadCard },
      { name: 'Replace', iconRight: <ReplaceIcon />, onClick: this.replaceCard },
    ]
    actions.forEach(actionItem => {
      if (actionItem.name === this.itemLoading) {
        actionItem.loading = true
      }
    })

    if (canEdit && !card.isPinnedAndLocked) {
      // Replace action is added later if this.props.canReplace
      items = _.reject(actions, { name: 'Replace' })
    } else {
      const viewActions = [
        'Duplicate',
        'Link',
        'Add to My Collection',
        'Download',
      ]
      items = _.filter(actions, a => _.includes(viewActions, a.name))
    }

    // if record is system required, we always remove these actions
    if (card.record && card.record.system_required) {
      items = _.reject(items, { name: 'Duplicate' })
      if (!card.link) {
        items = _.reject(items, { name: 'Archive' })
      }
    }

    if (uiStore.viewingCollection) {
      const coll = uiStore.viewingCollection
      // Remove Add To My Collection menu item for special collections
      if (coll.isUserCollection) {
        items = _.reject(items, { name: 'Add to My Collection' })
      }
    }

    if (card.record && !card.record.isDownloadable) {
      items = _.reject(items, { name: 'Download' })
    }

    if (canReplace) {
      items.push(_.find(actions, { name: 'Replace' }))
    }
    return items
  }

  render() {
    const { className, menuOpen } = this.props
    return (
      <PopoutMenu
        className={className}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.toggleOpen}
        menuItems={this.menuItems}
        menuOpen={menuOpen}
        width={250}
      />
    )
  }
}

CardMenu.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  className: PropTypes.string,
  menuOpen: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canReplace: PropTypes.bool.isRequired,
}
CardMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CardMenu.displayName = 'CardMenu'

CardMenu.defaultProps = {
  className: 'card-menu'
}

export default CardMenu
