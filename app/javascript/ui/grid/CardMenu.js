import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import PopoutMenu from '~/ui/global/PopoutMenu'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'
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

  duplicateCard = () => {
    this.props.uiStore.closeMoveMenu()
    const { card } = this.props
    card.API_duplicate()
  }

  replaceCard = () => {
    this.props.uiStore.closeMoveMenu()
    const { card } = this.props
    card.beginReplacing()
  }

  moveCard = () => {
    const { card, uiStore } = this.props
    uiStore.selectCardId(card.id)
    uiStore.openMoveMenu({ from: this.viewingCollectionId, cardAction: 'move' })
  }

  linkCard = () => {
    const { card, uiStore } = this.props
    uiStore.selectCardId(card.id)
    uiStore.openMoveMenu({ from: this.viewingCollectionId, cardAction: 'link' })
  }

  addToMyCollection = async () => {
    const { card, uiStore } = this.props
    uiStore.closeMoveMenu()
    this.setLoading('Add to My Collection')
    await card.API_linkToMyCollection()
    this.setLoading()
  }

  archiveCard = () => {
    this.props.uiStore.closeMoveMenu()
    this.props.card.API_archive()
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
    const { canEdit, canReplace, uiStore } = this.props
    let items = []
    const isUserCollection = uiStore.viewingCollection &&
      uiStore.viewingCollection.isUserCollection
    const actions = [
      { name: 'Duplicate', icon: <DuplicateIcon />, onClick: this.duplicateCard },
      { name: 'Move', icon: <MoveIcon />, onClick: this.moveCard },
      { name: 'Link', icon: <LinkIcon />, onClick: this.linkCard },
      ...(!isUserCollection
        ? [{ name: 'Add to My Collection', icon: <AddIntoIcon />, onClick: this.addToMyCollection }]
        : []),
      { name: 'Archive', icon: <ArchiveIcon />, onClick: this.archiveCard },
      { name: 'Replace', icon: <ReplaceIcon />, onClick: this.replaceCard },
    ]
    actions.forEach(actionItem => {
      if (actionItem.name === this.itemLoading) {
        actionItem.loading = true
      }
    })

    if (canEdit) {
      // Replace action is added later if this.props.canReplace
      items = _.reject(actions, { name: 'Replace' })
    } else {
      const viewActions = [
        'Duplicate',
        'Link',
        'Add to My Collection',
      ]
      items = _.filter(actions, a => _.includes(viewActions, a.name))
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
