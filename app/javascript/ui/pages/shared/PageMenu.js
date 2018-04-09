import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { uiStore } from '~/stores'
import TagIcon from '~/ui/icons/TagIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
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

  duplicateRecord = () => {
    uiStore.update('pageMenuOpen', false)
    this.props.record.API_duplicate()
  }

  archiveRecord = () => {
    uiStore.update('pageMenuOpen', false)
    this.props.record.API_archive()
  }

  get menuItems() {
    const items = [
      { name: 'Duplicate', icon: <DuplicateIcon />, onClick: this.duplicateRecord },
      { name: 'Tags', icon: <TagIcon />, onClick: this.showTags },
      { name: 'Permissions', icon: <PermissionsIcon />, onClick: this.showRolesMenu },
    ]
    if (this.props.canEdit) {
      items.push(
        { name: 'Archive', icon: <ArchiveIcon />, onClick: this.archiveRecord },
      )
    }
    if (this.props.disablePermissions) items.splice(1, 1)
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

        <TagEditor canEdit={this.props.canEdit} record={record} />
      </Fragment>
    )
  }
}

PageMenu.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  menuOpen: PropTypes.bool,
  canEdit: PropTypes.bool,
  disablePermissions: PropTypes.bool,
}
PageMenu.defaultProps = {
  menuOpen: false,
  canEdit: false,
  disablePermissions: false,
}

export default PageMenu
