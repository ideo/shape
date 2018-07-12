import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'
import styled from 'styled-components'

import ActivityLogButton from '~/ui/notifications/ActivityLogButton'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import EditableName from '~/ui/pages/shared/EditableName'
import Roles from '~/ui/grid/Roles'
import RolesSummary from '~/ui/roles/RolesSummary'
import PageMenu from '~/ui/pages/shared/PageMenu'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import SystemIcon from '~/ui/icons/SystemIcon'
import { FixedHeader, MaxWidthContainer } from '~/ui/global/styled/layout'
import { SubduedHeading1 } from '~/ui/global/styled/typography'
import { StyledTitleAndRoles } from '~/ui/pages/shared/styled'
import v from '~/utils/variables'

/* global IdeoSSO */

// NOTE: Header and PageHeader create sibling <header> elements on the page
const FixedPageHeader = FixedHeader.extend`
  top: ${v.globalHeaderHeight}px;
  z-index: ${v.zIndex.pageHeader};
`

const IconHolder = styled.span`
  color: ${v.colors.cloudy};
  display: inline-block;
  height: 30px;
  ${props => (props.align === 'left' ? 'margin-right: 10px;' : 'margin-left: 10px;')}
  margin-top: 16px;
  width: 30px;
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

  handleTitleClick = () => {
    const { record } = this.props
    if (record.isCurrentUserProfile) {
      window.open(IdeoSSO.profileUrl, '_blank')
    }
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
    // 2. CommentIcon (toggle ActivityLog)
    elements.push(
      <ActivityLogButton key="activity" />
    )
    if (this.hasActions) {
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

  get collectionIcon() {
    const { record } = this.props
    if (record.isProfileTemplate) {
      return <IconHolder align="left"><FilledProfileIcon /></IconHolder>
    }
    return null
  }

  get collectionTypeOrInheritedTags() {
    const { record } = this.props
    if (record.inherited_tag_list.length) {
      return (
        <SubduedHeading1>
          { record.inherited_tag_list.map(tag => `#${tag}`).join(',') }
        </SubduedHeading1>)
    }
    return null
  }

  get collectionTypeIcon() {
    const { record } = this.props
    if (record.isUserProfile) {
      return <IconHolder align="right"><ProfileIcon /></IconHolder>
    } else if (record.isProfileCollection) {
      return <IconHolder align="right"><SystemIcon /></IconHolder>
    }
    return null
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
            <StyledTitleAndRoles
              className={record.isCurrentUserProfile ? 'user-profile' : ''}
              justify="space-between"
            >
              <Box className="title" onClick={this.handleTitleClick}>
                { this.collectionIcon }
                <EditableName
                  name={record.name}
                  updateNameHandler={this.updateRecordName}
                  canEdit={this.canEdit}
                />
                { this.collectionTypeOrInheritedTags }
                { this.collectionTypeIcon }
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
