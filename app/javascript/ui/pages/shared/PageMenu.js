import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { uiStore } from '~/stores'
import TagIcon from '~/ui/icons/TagIcon'
import PermissionsIcon from '~/ui/icons/PermissionsIcon'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import TagEditor from '~/ui/pages/shared/TagEditor'

class PageMenu extends React.PureComponent {
  handleMouseLeave = () => {
    if (this.props.menuOpen) {
      uiStore.update('pageMenuOpen', false)
    }
  }

  toggleOpen = (e) => {
    e.stopPropagation()
    uiStore.update('pageMenuOpen', !uiStore.pageMenuOpen)
  }

  showTags = () => {
    uiStore.update('tagsModalOpen', true)
  }

  showRolesMenu = () => {
    uiStore.update('rolesMenuOpen', true)
  }

  archiveRecord = () => {
    uiStore.update('pageMenuOpen', false)
    this.props.record.API_archive()
  }

  get menuItems() {
    const items = [
      { name: 'Tags', icon: <TagIcon />, onClick: this.showTags },
      { name: 'Permissions', icon: <PermissionsIcon />, onClick: this.showRolesMenu },
      { name: 'Archive', icon: <ArchiveIcon />, onClick: this.archiveRecord },
    ]
    return items
  }

  render() {
    const { menuOpen, record } = this.props

    return (
      <Fragment>
        <PopoutMenu
          className="page-menu"
          onMouseLeave={this.handleMouseLeave}
          onClick={this.toggleOpen}
          menuItems={this.menuItems}
          menuOpen={menuOpen}
        />

        <TagEditor record={record} />
      </Fragment>
    )
  }
}

PageMenu.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  menuOpen: PropTypes.bool,
}
PageMenu.defaultProps = {
  menuOpen: false,
}

export default PageMenu
