import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import ActivityLogBox from '~/ui/activity_log/ActivityLogBox'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import { CircledIcon } from '~/ui/global/styled/buttons'
import CommentIcon from '~/ui/icons/CommentIcon'
import EditableName from '~/ui/pages/shared/EditableName'
import Header from '~/ui/layout/Header'
import RolesSummary from '~/ui/roles/RolesSummary'
import { StyledTitleAndRoles } from '~/ui/pages/shared/styled'
import PageMenu from '~/ui/pages/shared/PageMenu'

@inject('uiStore')
@observer
class PageHeader extends React.Component {
  get canEdit() {
    const { record } = this.props
    if (record.internalType === 'items') return record.can_edit
    return record.can_edit && !record.isUserCollection
  }

  hasActions() {
    const { record } = this.props
    return record.internalType === 'items' || record.isNormalCollection
  }

  showObjectRoleDialog = () => {
    const { uiStore } = this.props
    uiStore.update('rolesMenuOpen', true)
  }

  toggleComments() {
    const { uiStore } = this.props
    uiStore.update('activityLogOpen', !uiStore.activityLogOpen)
  }

  updateRecordName = (name) => {
    const { record } = this.props
    record.name = name
    record.save()
  }

  handleComments = (ev) => {
    ev.preventDefault()
    this.toggleComments()
  }

  get actions() {
    const { record, uiStore } = this.props
    // TODO temporarily disable item roles until we implement it
    return [
      ...(this.hasActions() && record.internalType !== 'items'
        ? [<RolesSummary
          key="roles"
          handleClick={this.showObjectRoleDialog}
          roles={record.roles}
          canEdit={record.can_edit}
        />]
        : []
      ),
      <CircledIcon
        key="comments"
        active={uiStore.activityLogOpen}
        onClick={this.handleComments}
      >
        <CommentIcon />
      </CircledIcon>,
      ...(this.hasActions()
        ? [<PageMenu
          key="menu"
          record={record}
          menuOpen={uiStore.pageMenuOpen}
          canEdit={record.can_edit}
        />]
        : []
      ),
    ]
  }

  render() {
    const { record, isHomepage, uiStore } = this.props
    const breadcrumb = isHomepage ? [] : record.breadcrumb
    return (
      <Header>
        <Breadcrumb items={breadcrumb} />
        <div>
          { uiStore.activityLogOpen && (
            <ActivityLogBox />
          )}
          <StyledTitleAndRoles justify="space-between">
            <Box className="title">
              <EditableName
                name={record.name}
                updateNameHandler={this.updateRecordName}
                canEdit={this.canEdit}
              />
            </Box>
            <Flex align="flex-end" style={{ height: '60px', marginTop: '-10px' }}>
              <Fragment>
                { this.actions }
              </Fragment>
            </Flex>
          </StyledTitleAndRoles>
        </div>
      </Header>
    )
  }
}

PageHeader.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  isHomepage: PropTypes.bool,
}

PageHeader.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

PageHeader.defaultProps = {
  isHomepage: false,
}

export default PageHeader
