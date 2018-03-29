import PropTypes from 'prop-types'

import { uiStore } from '~/stores'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import ReplaceIcon from '~/ui/icons/ReplaceIcon'
import MoveIcon from '~/ui/icons/MoveIcon'
import LinkIcon from '~/ui/icons/LinkIcon'

class CardMenu extends React.PureComponent {
  get cardId() {
    return this.props.cardId
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
    const duplicateItem = {
      name: 'Duplicate', icon: <DuplicateIcon />, onClick: this.props.handleDuplicate
    }
    let items = [duplicateItem]

    if (canEdit) {
      items = items.concat([
        { name: 'Move', icon: <MoveIcon />, onClick: this.props.handleMove },
        { name: 'Link', icon: <LinkIcon />, onClick: this.props.handleLink },
        { name: 'Archive', icon: <ArchiveIcon />, onClick: this.props.handleArchive },
      ])
    }

    if (canReplace) {
      items.push(
        { name: 'Replace', icon: <ReplaceIcon />, onClick: this.props.handleReplace }
      )
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
  cardId: PropTypes.number.isRequired,
  className: PropTypes.string,
  handleDuplicate: PropTypes.func.isRequired,
  handleLink: PropTypes.func.isRequired,
  handleMove: PropTypes.func.isRequired,
  handleArchive: PropTypes.func.isRequired,
  handleReplace: PropTypes.func.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canReplace: PropTypes.bool.isRequired,
}

CardMenu.defaultProps = {
  className: 'card-menu'
}

export default CardMenu
