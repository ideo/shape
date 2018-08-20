import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import ActivityLogButton from '~/ui/notifications/ActivityLogButton'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import ActionMenu from '~/ui/grid/ActionMenu'
import EditableName from '~/ui/pages/shared/EditableName'
import RolesModal from '~/ui/roles/RolesModal'
import RolesSummary from '~/ui/roles/RolesSummary'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import SystemIcon from '~/ui/icons/SystemIcon'
import TagEditorModal from '~/ui/pages/shared/TagEditorModal'
import { FixedHeader, MaxWidthContainer } from '~/ui/global/styled/layout'
import { SubduedHeading1 } from '~/ui/global/styled/typography'
import { StyledTitleAndRoles } from '~/ui/pages/shared/styled'
import { FormButton } from '~/ui/global/styled/forms'
import v from '~/utils/variables'
/* global IdeoSSO */

// NOTE: Header and PageHeader create sibling <header> elements on the page
const FixedPageHeader = FixedHeader.extend`
  top: ${v.globalHeaderHeight}px;
  z-index: ${v.zIndex.pageHeader};
`

const IconHolder = styled.span`
  color: ${v.colors.cloudy};
  display: block;
  height: 30px;
  ${props => (props.align === 'left' ? 'margin-right: 10px;' : 'margin-left: 10px;')}
  margin-top: 16px;
  width: 30px;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    height: 36px;
    width: 20px;
  }
`

@inject('routingStore', 'uiStore')
@observer
class PageHeader extends React.Component {
  @observable iconAndTagsWidth = 0

  get canEdit() {
    const { record } = this.props
    return record.can_edit_content && !record.system_required
  }

  get hasActions() {
    const { record } = this.props
    return record.internalType === 'items' || (!record.isUserCollection &&
      !record.isSharedCollection)
  }

  @action updateIconAndTagsWidth(ref) {
    if (!ref) return
    this.iconAndTagsWidth = ref.offsetWidth
  }

  showObjectRoleDialog = () => {
    const { uiStore, record } = this.props
    uiStore.update('rolesMenuOpen', record)
  }

  updateRecordName = (name) => {
    const { record } = this.props
    record.name = name
    record.save()
  }

  openMenu = () => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', true)
  }

  closeMenu = () => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', false)
  }

  routeBack = ({ type }) => {
    const { record, routingStore } = this.props
    if (record.internalType === 'items' || type === 'move' || type === 'archive') {
      if (record.parent_collection_card.parent_id) {
        routingStore.routeTo('collections',
          record.parent_collection_card.parent_id)
      } else {
        routingStore.routeTo('homepage')
      }
    }
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
    if (this.hasActions && record.parent_collection_card) {
      // TODO hacky way to include the record on the card link
      record.parent_collection_card.record = record
      // 3. ActionMenu actions
      elements.push(
        <ActionMenu
          key="action-menu"
          location="PageMenu"
          className="card-menu"
          card={record.parent_collection_card}
          canEdit={record.can_edit}
          canReplace={record.canReplace}
          menuOpen={uiStore.pageMenuOpen}
          onOpen={this.openMenu}
          onLeave={this.closeMenu}
          onMoveMenu={this.routeBack}
          afterArchive={this.routeBack}
        />
      )
    }
    return elements
  }

  openMoveMenuForTemplate = () => {
    const { record, uiStore } = this.props
    uiStore.openMoveMenu({
      from: record.id,
      cardAction: 'useTemplate',
    })
  }

  get collectionIcon() {
    const { record } = this.props
    if (record.isProfileTemplate) {
      return <IconHolder align="left"><FilledProfileIcon /></IconHolder>
    } else if (record.isMasterTemplate) {
      return <IconHolder align="left"><TemplateIcon circled filled /></IconHolder>
    }
    return null
  }

  get collectionTypeOrInheritedTags() {
    const { record } = this.props
    if (record.inherited_tag_list.length) {
      let tagList = record.inherited_tag_list.map(tag => `#${tag}`).join(',')
      if (tagList.length > 24) {
        tagList = `${tagList.slice(0, 21)}...`
      }
      return (
        <SubduedHeading1>
          { tagList }
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
    } else if (record.isTemplated) {
      return <IconHolder align="right"><TemplateIcon circled /></IconHolder>
    }
    return null
  }

  render() {
    const { record, isHomepage, uiStore } = this.props
    const breadcrumb = isHomepage ? [] : record.breadcrumb
    const tagEditorOpen = record.parent_collection_card &&
      uiStore.tagsModalOpenId === record.parent_collection_card.id

    const rolesRecord = uiStore.rolesMenuOpen ? uiStore.rolesMenuOpen : record
    return (
      <FixedPageHeader>
        <MaxWidthContainer>
          <RolesModal
            record={rolesRecord}
            roles={rolesRecord.roles}
          />
          <Breadcrumb items={breadcrumb} />
          <div>
            <StyledTitleAndRoles
              className={record.isCurrentUserProfile ? 'user-profile' : ''}
              justify="space-between"
            >
              <Flex align="flex-start" className="title" onClick={this.handleTitleClick}>
                { this.collectionIcon }
                <EditableName
                  name={record.name}
                  updateNameHandler={this.updateRecordName}
                  canEdit={this.canEdit}
                  extraWidth={this.iconAndTagsWidth}
                />
                <div
                  style={{ display: 'flex' }}
                  ref={(ref) => {
                    this.updateIconAndTagsWidth(ref)
                  }}
                >
                  { this.collectionTypeIcon }
                  { this.collectionTypeOrInheritedTags }
                </div>
                {record.isUsableTemplate &&
                  <FormButton
                    color="blue"
                    style={{ marginLeft: 10, marginTop: 10 }}
                    onClick={this.openMoveMenuForTemplate}
                  >
                    Use Template
                  </FormButton>
                }
              </Flex>
              <Flex align="flex-end" style={{ height: '60px', marginTop: '-10px' }}>
                <Fragment>
                  { this.actions }
                </Fragment>
              </Flex>
            </StyledTitleAndRoles>
          </div>
        </MaxWidthContainer>
        <TagEditorModal canEdit={this.canEdit} record={record} open={tagEditorOpen} />
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
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

PageHeader.defaultProps = {
  isHomepage: false,
}

export default PageHeader
