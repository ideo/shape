import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import { uiStore } from '~/stores'
import TagIcon from '~/ui/icons/TagIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import PermissionsIcon from '~/ui/icons/PermissionsIcon'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import TagEditorModal from '~/ui/pages/shared/TagEditorModal'

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
    const { canEdit, disablePermissions, record } = this.props
    let items = []
    if (!record.system_required) {
      items.push(
        { name: 'Duplicate', icon: <DuplicateIcon />, onClick: this.duplicateRecord },
      )
    }
    items.push(
      { name: 'Tags', icon: <TagIcon />, onClick: this.showTags },
      { name: 'Permissions', icon: <PermissionsIcon />, onClick: this.showRolesMenu },
    )
    if (canEdit) {
      items.push(
        { name: 'Archive', icon: <ArchiveIcon />, onClick: this.archiveRecord },
      )
    }
    if (disablePermissions) {
      items = _.reject(items, { name: 'Permissions' })
    }
    return items
  }

  render() {
    const { menuOpen, record, canEditContent } = this.props

    return (
      <Fragment>
        <PopoutMenu
          className="page-menu"
          onMouseLeave={this.handleMouseLeave}
          onClick={this.toggleOpen}
          menuItems={this.menuItems}
          menuOpen={menuOpen}
        />

        <TagEditorModal canEdit={canEditContent} record={record} />
      </Fragment>
    )
  }
}

PageMenu.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  menuOpen: PropTypes.bool,
  canEdit: PropTypes.bool,
  canEditContent: PropTypes.bool,
  disablePermissions: PropTypes.bool,
}
PageMenu.defaultProps = {
  menuOpen: false,
  canEdit: false,
  canEditContent: false,
  disablePermissions: false,
}

export default PageMenu
