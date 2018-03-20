import PropTypes from 'prop-types'

import { uiStore } from '~/stores'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import ShareIcon from '~/ui/icons/ShareIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import MoveIcon from '~/ui/icons/MoveIcon'
import LinkIcon from '~/ui/icons/LinkIcon'

class CardMenu extends React.PureComponent {
  get cardId() {
    return this.props.cardId
  }

  handleMouseLeave = () => {
    if (this.props.menuOpen) {
      uiStore.openCardMenu(false)
    }
  }

  toggleOpen = (e) => {
    e.stopPropagation()
    if (this.props.menuOpen) {
      uiStore.openCardMenu(false)
    } else {
      uiStore.openCardMenu(this.cardId)
    }
  }

  get menuItems() {
    let items
    const duplicateItem = {
      name: 'Duplicate',
      icon: <DuplicateIcon />,
      onClick: this.props.handleDuplicate
    }

    if (this.props.canEdit) {
      items = [
        { name: 'Share', icon: <ShareIcon />, onClick: this.props.handleShare },
        duplicateItem,
        { name: 'Link', icon: <LinkIcon />, onClick: this.props.handleLink },
        { name: 'Organize', icon: <MoveIcon />, onClick: this.props.handleOrganize },
        { name: 'Archive', icon: <ArchiveIcon />, onClick: this.props.handleArchive },
      ]
    } else {
      items = [duplicateItem]
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
  handleShare: PropTypes.func.isRequired,
  handleDuplicate: PropTypes.func.isRequired,
  handleLink: PropTypes.func.isRequired,
  handleOrganize: PropTypes.func.isRequired,
  handleArchive: PropTypes.func.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
}

CardMenu.defaultProps = {
  className: 'card-menu'
}

export default CardMenu
