import _ from 'lodash'
import styled from 'styled-components'
import { Fragment } from 'react'
import { observable, action, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'
import Hidden from '@material-ui/core/Hidden'

import Breadcrumb from '~/ui/layout/Breadcrumb'
import CornerPositioned from '~/ui/global/CornerPositioned'
import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import GlobalSearch from '~/ui/layout/GlobalSearch'
import ActionMenu from '~/ui/grid/ActionMenu'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import ActivityLogButton from '~/ui/notifications/ActivityLogButton'
import IconAvatar from '~/ui/global/IconAvatar'
import RolesSummary from '~/ui/roles/RolesSummary'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import UserDropdown from '~/ui/layout/UserDropdown'
import OrganizationDropdown from '~/ui/layout/OrganizationDropdown'
import {
  FixedHeader,
  MaxWidthContainer,
  HeaderSpacer,
} from '~/ui/global/styled/layout'
import Button from '~/ui/global/Button'
import EditableName from '~/ui/pages/shared/EditableName'
import Avatar from '~/ui/global/Avatar'
import v, { EVENT_SOURCE_TYPES } from '~/utils/variables'
import BasicHeader from '~/ui/layout/BasicHeader'
import LoggedOutBasicHeader from '~/ui/layout/LoggedOutBasicHeader'
import { calculatePopoutMenuOffset } from '~/utils/clickUtils'
import IconHolder from '~/ui/icons/IconHolder'
import { collectionTypeToIcon } from '~/ui/global/CollectionTypeIcon'

const BackIconContainer = styled.span`
  color: ${v.colors.black};
  display: inline-block;
  height: 18px;
  margin-right: 8px;
  width: 12px;
  vertical-align: middle;
`

const StyledSeparator = styled.div`
  width: 1px;
  height: 32px;
  background-color: ${v.colors.commonMedium};
  display: inline-block;
  margin-left: 8px;
`

@inject('apiStore', 'routingStore', 'uiStore')
@observer
class Header extends React.Component {
  state = {
    headerMenuOffsetPosition: null,
  }
  @observable
  actionsWidth = 0

  @observable
  breadcrumbsWidth = null

  @action
  updateActionsWidth(ref) {
    if (!ref) return
    this.actionsWidth = ref.offsetWidth
  }

  @action
  updateBreadcrumbsWidth(ref) {
    if (!ref) return
    this.breadcrumbsWidth = ref.offsetWidth
  }

  showObjectRoleDialog = () => {
    const { record } = this
    const { uiStore } = this.props
    uiStore.update('rolesMenuOpen', record)
  }

  openMenu = ev => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', true)
    const { offsetX, offsetY } = calculatePopoutMenuOffset(
      ev,
      EVENT_SOURCE_TYPES.PAGE_MENU
    )
    this.setState({
      headerMenuOffsetPosition: { x: offsetX, y: offsetY },
    })
  }

  closeMenu = () => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', false)
    this.setState({
      headerMenuOffsetPosition: null,
    })
  }

  closeOrgMenu = () => {
    this.props.uiStore.update('organizationMenuPage', null)
  }

  get onArchivedPage() {
    const { record } = this
    const { routingStore } = this.props
    const searchingArchived = routingStore.extraSearchParams.show_archived
    return (
      (record && record.archived) ||
      (routingStore.isSearch && searchingArchived)
    )
  }

  get backgroundColor() {
    const { record } = this
    if (this.onArchivedPage) {
      return v.colors.commonMediumTint
    } else if (record && record.isFourWideBoard) {
      // NOTE: temporary to indicate prototype feature
      return v.colors.prototype
    } else {
      return v.colors.commonLight
    }
  }

  routeBack = ({ type } = {}) => {
    const { record } = this
    const { routingStore } = this.props
    if (
      record.internalType === 'items' ||
      type === 'move' ||
      type === 'archive'
    ) {
      const { parent_collection_card } = record
      if (
        parent_collection_card.parent_id &&
        parent_collection_card.can_edit_parent
      ) {
        routingStore.routeTo('collections', parent_collection_card.parent_id)
      } else {
        routingStore.routeTo('homepage')
      }
    }
  }

  get hasActions() {
    const { record } = this
    return (
      record.internalType === 'items' ||
      (!record.isUserCollection && !record.isSharedCollection)
    )
  }

  get rolesSummary() {
    const { record } = this
    const { uiStore, apiStore } = this.props
    const { currentUserOrganization } = apiStore
    if (!this.hasActions) return null
    if (record.isCommonViewable) {
      if (!currentUserOrganization) return null
      return (
        // simple way to show org as a viewer of the common_viewable resource
        <div style={{ marginLeft: '5px' }}>
          <Avatar
            url={currentUserOrganization.primary_group.filestack_file_url}
            className="viewer"
            title={`${currentUserOrganization.name} and Guests`}
            displayName
          />
        </div>
      )
    }
    return (
      <RolesSummary
        key="roles"
        handleClick={this.showObjectRoleDialog}
        roles={[...record.roles]}
        canEdit={record.can_edit}
        // convert observable to normal array to trigger render changes
        collaborators={[...record.collaborators]}
        rolesMenuOpen={!!uiStore.rolesMenuOpen}
      />
    )
  }

  get actionMenu() {
    const { record, state } = this
    const { uiStore } = this.props
    const { headerMenuOffsetPosition } = state
    if (!this.hasActions) return null
    // NOTE: Org templates has no parent card, therefore no actions
    if (record.parent_collection_card) {
      // this is how we relate the record back to its card
      record.parent_collection_card.record = record
      return (
        <IconAvatar backgroundColor={v.colors.white} color={v.colors.black}>
          <ActionMenu
            key="action-menu"
            location="PageMenu"
            className="card-menu"
            card={record.parent_collection_card}
            canView={record.can_view}
            canEdit={record.can_edit}
            canReplace={record.canReplace}
            submissionBox={record.isSubmissionBox}
            menuOpen={!!uiStore.pageMenuOpen}
            onOpen={this.openMenu}
            onLeave={this.closeMenu}
            onMoveMenu={this.routeBack}
            afterArchive={this.routeBack}
            offsetPosition={headerMenuOffsetPosition}
          />
        </IconAvatar>
      )
    }
    return null
  }

  @computed
  get maxBreadcrumbContainerWidth() {
    const outer = this.breadcrumbsWidth - this.actionsWidth
    return Math.min(outer, 700)
  }

  @computed
  get record() {
    const { uiStore } = this.props
    return uiStore.viewingRecord
  }

  renderMobileSearch() {
    const { routingStore } = this.props
    return (
      <Fragment>
        <FixedHeader data-empty-space-click>
          <MaxWidthContainer>
            <Flex align="center" style={{ minHeight: v.headerHeight }}>
              <button onClick={routingStore.leaveSearch}>
                <BackIconContainer>
                  <ArrowIcon />
                </BackIconContainer>
              </button>

              <Box>
                <GlobalSearch open className="search-bar" />
              </Box>
            </Flex>
          </MaxWidthContainer>
        </FixedHeader>
        <HeaderSpacer />
      </Fragment>
    )
  }

  renderChallengeFixedHeader() {
    const { uiStore } = this.props
    return (
      <MaxWidthContainer>
        <Flex
          data-empty-space-click
          align="center"
          style={{ minHeight: v.headerHeight }}
        >
          <Box style={{ paddingRight: '12px' }}>
            <EditableName
              name={uiStore.viewingRecord.name}
              updateNameHandler={e => e.preventDefault()}
              inline
            />
            <IconHolder
              align="right"
              height={32}
              width={32}
              display={'inline-block'}
              marginTop={0}
            >
              {collectionTypeToIcon({
                type: uiStore.viewingRecord.collection_type,
                size: 'lg',
              })}
            </IconHolder>
          </Box>

          <Box auto></Box>

          <Box flex align="center" style={{ marginLeft: '8px' }}>
            <Button
              style={{ marginLeft: '1rem' }}
              colorScheme={v.colors.primaryDarkest}
              size="sm"
              width={256}
            >
              Challenge Settings
            </Button>
          </Box>
        </Flex>
      </MaxWidthContainer>
    )
  }

  render() {
    const { record } = this
    const { apiStore, routingStore, uiStore } = this.props
    const { currentUser, currentUserOrganization } = apiStore
    const { shouldRenderFixedHeader } = uiStore

    if (!currentUser) {
      // user is not logged in, or:
      // user needs to set up their Org, will see the Org popup before proceeding
      return (
        <LoggedOutBasicHeader
          organization={record ? record.organization : null}
          redirectPath={record ? record.frontendPath : null}
        />
      )
    } else if (!currentUserOrganization) {
      return <BasicHeader orgMenu={uiStore.organizationMenuOpen} />
    }
    if (routingStore.isSearch && uiStore.isMobileXs) {
      return this.renderMobileSearch()
    }

    const ActivityButtonWrapper = uiStore.isMobileXs
      ? CornerPositioned
      : styled.div``

    let breadcrumbKey = ''
    if (record) {
      breadcrumbKey = `${record.identifier}_${record.breadcrumbSize}_${_.map(
        uiStore.linkedBreadcrumbTrail,
        'id'
      )}`
    }

    const viewingChallenge =
      _.get(uiStore.viewingRecord, 'collection_type') === 'challenge' ||
      _.get(uiStore.viewingRecord, 'isInsideAChallenge')

    return (
      <Fragment>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body { background-color:  ${this.backgroundColor};
          transition: background-color 0.5s ease;
          }
        `,
          }}
        />
        <FixedHeader
          darkBackground={this.onArchivedPage}
          data-empty-space-click
        >
          <MaxWidthContainer>
            <Flex
              data-empty-space-click
              align="center"
              style={{ minHeight: v.headerHeight }}
            >
              <Box style={{ paddingRight: '12px' }}>
                <PlainLink
                  to={routingStore.pathTo('homepage')}
                  onClick={routingStore.clearHomepageScrollState}
                >
                  <Logo />
                </PlainLink>
              </Box>

              <Box auto>
                <div ref={ref => this.updateBreadcrumbsWidth(ref)}>
                  {record && (
                    <Flex data-empty-space-click align="center">
                      <div
                        style={{
                          flex: uiStore.isMobile ? '1 1 auto' : '0 1 auto',
                        }}
                      >
                        <Breadcrumb
                          maxDepth={uiStore.isLargeBreakpoint ? 6 : 1}
                          backButton={!uiStore.isLargeBreakpoint}
                          record={record}
                          isHomepage={uiStore.isViewingHomepage}
                          // re-mount every time the record / breadcrumb changes
                          key={breadcrumbKey}
                          // force props update if windowWidth changes
                          windowWidth={uiStore.windowWidth}
                          containerWidth={this.maxBreadcrumbContainerWidth}
                        />
                      </div>
                      <Box>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            whiteSpace: 'nowrap',
                          }}
                          ref={ref => {
                            this.updateActionsWidth(ref)
                          }}
                        >
                          {this.actionMenu && (
                            <Fragment>
                              {this.actionMenu}
                              <Hidden smDown>
                                <StyledSeparator />
                              </Hidden>
                            </Fragment>
                          )}
                          <Hidden smDown>{this.rolesSummary}</Hidden>
                        </div>
                      </Box>
                    </Flex>
                  )}
                </div>
              </Box>

              <Box flex align="center" style={{ marginLeft: '8px' }}>
                <Hidden xsDown>
                  <GlobalSearch className="search-bar" />
                </Hidden>
                {record && (
                  <ActivityButtonWrapper>
                    <IconAvatar
                      color={
                        uiStore.isMobileXs ? v.colors.white : v.colors.black
                      }
                      backgroundColor={
                        uiStore.isMobileXs
                          ? v.colors.secondaryDark
                          : v.colors.white
                      }
                    >
                      <ActivityLogButton key="activity" />
                    </IconAvatar>
                  </ActivityButtonWrapper>
                )}
                <OrganizationMenu
                  organization={currentUserOrganization}
                  userGroups={currentUser.groups}
                  onClose={this.closeOrgMenu}
                  open={uiStore.organizationMenuOpen}
                />
                <Hidden smDown>
                  <OrganizationDropdown />
                </Hidden>
                <UserDropdown />
              </Box>
            </Flex>
          </MaxWidthContainer>
          {viewingChallenge &&
            shouldRenderFixedHeader &&
            this.renderChallengeFixedHeader()}
        </FixedHeader>
        <HeaderSpacer />
      </Fragment>
    )
  }
}

Header.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Header
