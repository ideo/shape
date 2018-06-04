import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import ActivityLogButton from '~/ui/notifications/ActivityLogButton'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import EditableName from '~/ui/pages/shared/EditableName'
import Roles from '~/ui/grid/Roles'
import RolesSummary from '~/ui/roles/RolesSummary'
import PageMenu from '~/ui/pages/shared/PageMenu'
import { FixedHeader, MaxWidthContainer } from '~/ui/global/styled/layout'
import { StyledTitleAndRoles } from '~/ui/pages/shared/styled'
import v from '~/utils/variables'

// NOTE: Header and PageHeader create sibling <header> elements on the page
const FixedPageHeader = FixedHeader.extend`
  top: ${v.globalHeaderHeight}px;
  z-index: ${v.zIndex.pageHeader};
`

@inject('uiStore')
@observer
class PageHeader extends React.Component {
  get canEdit() {
    const { record } = this.props
    if (record.internalType === 'items') return record.can_edit
    return record.can_edit && !record.isUserCollection
  }

  get hasActions() {
    const { record } = this.props
    return record.internalType === 'items' || record.isNormalCollection
  }

  showObjectRoleDialog = () => {
    const { uiStore } = this.props
    uiStore.update('rolesMenuOpen', true)
  }

  updateRecordName = (name) => {
    const { record } = this.props
    record.name = name
    record.save()
  }

  get actions() {
    const { record, uiStore } = this.props
    const elements = []
    // 1. RolesSummary
    if (this.hasActions) {
      elements.push(
        <RolesSummary
          key="roles"
          handleClick={this.showObjectRoleDialog}
          roles={record.roles}
          canEdit={record.can_edit}
        />
      )
    }
    if (this.hasActions) {
      // 2. CommentIcon (toggle ActivityLog)
      elements.push(
        <ActivityLogButton key="activity" />
      )
      // 3. PageMenu actions
      elements.push(
        <PageMenu
          key="menu"
          record={record}
          menuOpen={uiStore.pageMenuOpen}
          canEdit={record.can_edit}
        />
      )
    }
    return elements
  }

  render() {
    const { record, isHomepage } = this.props
    const breadcrumb = isHomepage ? [] : record.breadcrumb
    return (
      <FixedPageHeader>
        <MaxWidthContainer>
          <Roles
            record={record}
            roles={record.roles}
          />
          <Breadcrumb items={breadcrumb} />
          <div>
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
        </MaxWidthContainer>
      </FixedPageHeader>
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
