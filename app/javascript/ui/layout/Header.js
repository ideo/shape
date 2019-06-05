import styled from 'styled-components'
import { Fragment } from 'react'
import { observable, action, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'
import Hidden from '@material-ui/core/Hidden'

import Breadcrumb from '~/ui/layout/Breadcrumb'
import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import GlobalSearch from '~/ui/layout/GlobalSearch'
import ActionMenu from '~/ui/grid/ActionMenu'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import ActivityLogButton from '~/ui/notifications/ActivityLogButton'
import RolesSummary from '~/ui/roles/RolesSummary'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import UserDropdown from '~/ui/layout/UserDropdown'
import OrganizationDropdown from '~/ui/layout/OrganizationDropdown'
import {
  FixedHeader,
  MaxWidthContainer,
  HeaderSpacer,
} from '~/ui/global/styled/layout'
import Avatar from '~/ui/global/Avatar'
import v from '~/utils/variables'
import BasicHeader from '~/ui/layout/BasicHeader'
import LoggedOutBasicHeader from '~/ui/layout/LoggedOutBasicHeader'

/* global IdeoSSO */

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

const StyledRoundBtn = styled.div`
  box-sizing: border-box;
  display: inline-block;
  vertical-align: top;
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: white;
  margin: 0 0 0 8px;
  line-height: 32px;
  font-size: 1.5rem;
  text-align: center;
  cursor: pointer;
`
StyledRoundBtn.displayName = 'StyledRoundBtn'

const StyledActivityLogBtn = styled(StyledRoundBtn)`
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    position: fixed;
    bottom: 15px;
    right: 15px;
    color: ${v.colors.white};
    background: ${v.colors.secondaryDark};
  }
`

@inject('apiStore', 'routingStore', 'uiStore')
@observer
class Header extends React.Component {
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
    const direction = ev.screenX < v.actionMenuWidth ? 'right' : 'left'
    uiStore.update('pageMenuOpen', direction)
  }

  closeMenu = () => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', false)
  }

  closeOrgMenu = () => {
    this.props.uiStore.update('organizationMenuPage', null)
  }

  routeBack = ({ type } = {}) => {
    const { record } = this
    const { routingStore } = this.props
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
        roles={record.roles}
        canEdit={record.can_edit}
        rolesMenuOpen={!!uiStore.rolesMenuOpen}
      />
    )
  }

  get actionMenu() {
    const { record } = this
    const { uiStore } = this.props
    if (!this.hasActions) return null
    if (record.parent_collection_card) {
      // TODO hacky way to include the record on the card link
      record.parent_collection_card.record = record
      return (
        <StyledRoundBtn style={{ paddingLeft: '2px' }}>
          <ActionMenu
            key="action-menu"
            location="PageMenu"
            className="card-menu"
            card={record.parent_collection_card}
            canView={record.can_view}
            canEdit={record.can_edit}
            canReplace={record.canReplace}
            direction={uiStore.pageMenuOpen || 'left'}
            submissionBox={record.isSubmissionBox}
            menuOpen={!!uiStore.pageMenuOpen}
            onOpen={this.openMenu}
            onLeave={this.closeMenu}
            onMoveMenu={this.routeBack}
            afterArchive={this.routeBack}
          />
        </StyledRoundBtn>
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
    return uiStore.viewingCollection || uiStore.viewingItem
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

  render() {
    const { record } = this
    const { apiStore, routingStore, uiStore } = this.props
    const { currentUser, currentUserOrganization } = apiStore

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

    return (
      <Fragment>
        <FixedHeader data-empty-space-click>
          <MaxWidthContainer>
            <Flex
              data-empty-space-click
              align="center"
              style={{ minHeight: v.headerHeight }}
            >
              <Box style={{ paddingRight: '12px' }}>
                <PlainLink to={routingStore.pathTo('homepage')}>
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
                          key={`${record.identifier}_${record.breadcrumbSize}`}
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
                  <StyledActivityLogBtn>
                    <ActivityLogButton key="activity" />
                  </StyledActivityLogBtn>
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
