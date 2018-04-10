import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import { uiStore } from '~/stores'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import ReplaceIcon from '~/ui/icons/ReplaceIcon'
import MoveIcon from '~/ui/icons/MoveIcon'
import LinkIcon from '~/ui/icons/LinkIcon'

class CardMenu extends React.PureComponent {
  get cardId() {
    return this.props.card.id
  }

  duplicateCard = () => {
    uiStore.closeMoveMenu()
    const { card } = this.props
    card.API_duplicate()
  }

  replaceCard = () => {
    uiStore.closeMoveMenu()
    const { card } = this.props
    card.beginReplacing()
  }

  moveCard = () => {
    const { card } = this.props
    uiStore.selectCardId(card.id)
    uiStore.openMoveMenu({ from: uiStore.viewingCollection.id, cardAction: 'move' })
  }

  linkCard = () => {
    const { card } = this.props
    uiStore.selectCardId(card.id)
    uiStore.openMoveMenu({ from: uiStore.viewingCollection.id, cardAction: 'link' })
  }

  archiveCard = () => {
    uiStore.closeMoveMenu()
    this.props.card.API_archive()
  }

  handleMouseLeave = () => {
    if (this.props.menuOpen) {
      uiStore.update('openCardMenuId', false)
    }
  }

  toggleOpen = (e) => {
    e.stopPropagation()
    if (this.props.menuOpen) {
      uiStore.update('openCardMenuId', false)
    } else {
      uiStore.update('openCardMenuId', this.cardId)
    }
  }

  get menuItems() {
    const { canEdit, canReplace } = this.props
    let items = []
    const actions = [
      { name: 'Duplicate', icon: <DuplicateIcon />, onClick: this.duplicateCard },
      { name: 'Move', icon: <MoveIcon />, onClick: this.moveCard },
      { name: 'Link', icon: <LinkIcon />, onClick: this.linkCard },
      { name: 'Archive', icon: <ArchiveIcon />, onClick: this.archiveCard },
      { name: 'Replace', icon: <ReplaceIcon />, onClick: this.replaceCard },
    ]

    if (canEdit) {
      // Replace action is added later if this.props.canReplace
      items = _.reject(actions, { name: 'Replace' })
    } else {
      const viewActions = [
        'Duplicate',
        'Link',
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

CardMenu.defaultProps = {
  className: 'card-menu'
}

export default CardMenu
