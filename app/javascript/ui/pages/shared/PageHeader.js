import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'
import CopyToClipboard from 'react-copy-to-clipboard'

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
import LinkIconSm from '~/ui/icons/LinkIconSm'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
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
  height: 32px;
  ${props =>
    props.align === 'left'
      ? 'margin-right: 12px;'
      : 'margin-left: 6px;'} margin-top: 14px;
  width: 32px;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    height: 36px;
    width: 20px;
  }
`

const HeaderFormButton = FormButton.extend`
  margin-left: 30px;
  margin-top: 10px;
  font-size: 0.825rem;
`
HeaderFormButton.displayName = 'HeaderFormButton'
HeaderFormButton.defaultProps = {
  'data-cy': 'HeaderFormButton',
}

const LiveTestIndicator = styled.span`
  display: inline-block;
  color: ${v.colors.orange};
  font-weight: 500;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-left: 0.25rem;
  padding-top: 1.33rem;
`

@inject('routingStore', 'uiStore')
@observer
class PageHeader extends React.Component {
  @observable
  iconAndTagsWidth = 0
  @observable
  actionsWidth = 0

  get canEdit() {
    const { record } = this.props
    return record.can_edit_content && !record.system_required
  }

  get hasActions() {
    const { record } = this.props
    return (
      record.internalType === 'items' ||
      (!record.isUserCollection && !record.isSharedCollection)
    )
  }

  @action
  updateIconAndTagsWidth(ref) {
    const { record } = this.props
    if (!ref) return
    let width = ref.offsetWidth
    // account for header button (NOTE: what about others e.g. launch test?)
    if (record.isUsableTemplate) width += 165
    // account for profile/master icon at front
    if (record.isProfileTemplate || record.isMasterTemplate) width += 40
    this.iconAndTagsWidth = width
  }

  @action
  updateActionsWidth(ref) {
    if (!ref) return
    this.actionsWidth = ref.offsetWidth
  }

  showObjectRoleDialog = () => {
    const { uiStore, record } = this.props
    uiStore.update('rolesMenuOpen', record)
  }

  updateRecordName = name => {
    const { record } = this.props
    // method exists on Item and Collection
    record.API_updateName(name)
  }

  openMenu = () => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', true)
  }

  closeMenu = () => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', false)
  }

  routeBack = ({ type } = {}) => {
    const { record, routingStore } = this.props
    if (
      record.internalType === 'items' ||
      type === 'move' ||
      type === 'archive'
    ) {
      if (record.parent_collection_card.parent_id) {
        routingStore.routeTo(
          'collections',
          record.parent_collection_card.parent_id
        )
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
    elements.push(<ActivityLogButton key="activity" />)
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
          submissionBox={record.isSubmissionBox}
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
      return (
        <IconHolder align="left">
          <FilledProfileIcon />
        </IconHolder>
      )
    } else if (record.isMasterTemplate) {
      return (
        <IconHolder align="left">
          <TemplateIcon circled filled />
        </IconHolder>
      )
    }
    return null
  }

  get collectionTypeOrInheritedTags() {
    const { record, uiStore } = this.props
    // not enough room to show in the header of a live Test
    if (record.isLiveTest) return null
    if (uiStore.windowWidth < v.responsive.smallBreakpoint) return null
    if (record.inherited_tag_list.length) {
      let tagList = record.inherited_tag_list.map(tag => `#${tag}`).join(',')
      if (tagList.length > 24) {
        tagList = `${tagList.slice(0, 21)}...`
      }
      return <SubduedHeading1>{tagList}</SubduedHeading1>
    }
    return null
  }

  get collectionTypeIcon() {
    const { record } = this.props
    let icon = ''
    if (record.isUserProfile) {
      icon = <ProfileIcon />
    } else if (record.isProfileCollection) {
      icon = <SystemIcon />
    } else if (record.isTemplated) {
      icon = <TemplateIcon circled />
    } else if (record.isSubmissionBox) {
      icon = <SubmissionBoxIconLg />
    } else if (record.isTestCollectionOrTestDesign) {
      icon = <TestCollectionIcon />
    }
    if (icon) {
      return <IconHolder align="right">{icon}</IconHolder>
    }
    return null
  }

  render() {
    const { record, isHomepage, uiStore } = this.props
    const tagEditorOpen =
      record.parent_collection_card &&
      uiStore.tagsModalOpenId === record.parent_collection_card.id

    const rolesRecord = uiStore.rolesMenuOpen ? uiStore.rolesMenuOpen : record

    return (
      <FixedPageHeader>
        <MaxWidthContainer>
          <RolesModal record={rolesRecord} roles={rolesRecord.roles} />
          <Breadcrumb
            record={record}
            isHomepage={isHomepage}
            // re-mount every time the record / breadcrumb changes
            key={`${record.identifier}_${record.breadcrumbSize}`}
            // force props update if windowWidth changes
            windowWidth={uiStore.windowWidth}
          />
          <div>
            <StyledTitleAndRoles
              className={record.isCurrentUserProfile ? 'user-profile' : ''}
              justify="space-between"
            >
              <Flex
                align="flex-start"
                className="title"
                onClick={this.handleTitleClick}
              >
                {this.collectionIcon}
                <EditableName
                  name={record.name}
                  updateNameHandler={this.updateRecordName}
                  canEdit={this.canEdit}
                  extraWidth={this.iconAndTagsWidth}
                  actionsWidth={this.actionsWidth}
                />
                {/* Can't use <Flex> if we want to attach refs... */}
                <div
                  style={{ display: 'flex' }}
                  ref={ref => {
                    this.updateIconAndTagsWidth(ref)
                  }}
                >
                  {this.collectionTypeIcon}
                  {record.isLiveTest && (
                    <LiveTestIndicator>Live</LiveTestIndicator>
                  )}
                  {this.collectionTypeOrInheritedTags}
                </div>
                {record.isUsableTemplate && (
                  <HeaderFormButton
                    width="160"
                    color="blue"
                    onClick={this.openMoveMenuForTemplate}
                  >
                    Use Template
                  </HeaderFormButton>
                )}
                {record.isLaunchableTest &&
                  record.can_edit && (
                    <HeaderFormButton onClick={record.launchTest}>
                      Get Feedback
                    </HeaderFormButton>
                  )}
                {record.isLiveTest && (
                  <Fragment>
                    <CopyToClipboard
                      text={record.publicTestURL}
                      onCopy={() => null}
                    >
                      <HeaderFormButton
                        width="140"
                        color="hollow"
                        onClick={() =>
                          uiStore.popupSnackbar({ message: 'Test link copied' })
                        }
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            height: 24,
                            width: 27,
                            verticalAlign: 'middle',
                          }}
                        >
                          <LinkIconSm />
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            verticalAlign: 'middle',
                          }}
                        >
                          Get Link
                        </span>
                      </HeaderFormButton>
                    </CopyToClipboard>
                    <HeaderFormButton
                      width="170"
                      color="hollow"
                      style={{ marginLeft: 10 }}
                      onClick={() => console.log('stopped!')}
                    >
                      Stop Feedback
                    </HeaderFormButton>
                  </Fragment>
                )}
              </Flex>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  whiteSpace: 'nowrap',
                  height: '60px',
                  marginTop: '-10px',
                }}
                ref={ref => {
                  this.updateActionsWidth(ref)
                }}
              >
                <Fragment>{this.actions}</Fragment>
              </div>
            </StyledTitleAndRoles>
          </div>
        </MaxWidthContainer>
        <TagEditorModal
          canEdit={this.canEdit}
          record={record}
          open={tagEditorOpen}
        />
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
