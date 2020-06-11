import _ from 'lodash'
import { Fragment } from 'react'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'
import CopyToClipboard from 'react-copy-to-clipboard'

import EditableName from '~/ui/pages/shared/EditableName'
import RolesModal from '~/ui/roles/RolesModal'
import Tooltip from '~/ui/global/Tooltip'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
import HiddenIconButton from '~/ui/global/HiddenIconButton'
import LinkIconSm from '~/ui/icons/LinkIconSm'
import BackIcon from '~/ui/icons/BackIcon'
import CollectionCardsTagEditorModal from '~/ui/pages/shared/CollectionCardsTagEditorModal'
import { StyledHeader, MaxWidthContainer } from '~/ui/global/styled/layout'
import Button from '~/ui/global/Button'
import {
  SubduedHeading1,
  HeaderButtonText,
} from '~/ui/global/styled/typography'
import { StyledTitleAndRoles } from '~/ui/pages/shared/styled'
import LanguageSelector from '~/ui/layout/LanguageSelector'
import TruncatableText from '~/ui/global/TruncatableText'
import v from '~/utils/variables'
import CollectionTypeIcon, {
  collectionTypeToIcon,
} from '~/ui/global/CollectionTypeIcon'
import CollectionTypeSelector from '~/ui/global/CollectionTypeSelector'
import IdeoSSO from '~/utils/IdeoSSO'
import IconHolder from '~/ui/icons/IconHolder'
import TopRightChallengeButton from '~/ui/global/TopRightChallengeButton'
import ChallengeSubHeader from '~/ui/layout/ChallengeSubHeader'
import ChallengePhasesIcons from '~/ui/challenges/ChallengePhasesIcons'

const LiveTestIndicator = styled.span`
  display: inline-block;
  color: ${v.colors.alert};
  font-weight: 500;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-left: 0.25rem;
  padding-top: 1.33rem;
`

const HeaderButtonContainer = styled.span`
  display: flex;
  margin-top: 10px;

  button {
    margin-right: 10px;
  }
`
HeaderButtonContainer.displayName = 'HeaderButtonContainer'

const StyledButtonIconWrapper = styled.span`
  display: inline-block;
  vertical-align: middle;
  height: ${props => (props.height ? props.height : 24)}px;
  width: ${props => (props.width ? props.width : 27)}px;
  padding: 4px;
  ${props =>
    props.float &&
    `
      float: ${props.float};
    `}
  ${props =>
    props.float === 'right' &&
    `
    position: relative;
    right: 6px;
  `}
`
StyledButtonIconWrapper.displayName = 'StyledButtonIconWrapper'

const FixedRightContainer = styled(Flex)`
  position: relative;
  top: 22px;
  right: 60px;
  height: 33px;
`

@inject('uiStore', 'apiStore', 'routingStore')
@observer
class PageHeader extends React.Component {
  @observable
  iconAndTagsWidth = 0
  templateButtonRef = null

  get canEdit() {
    const { record } = this.props
    return record.can_edit_content && !record.system_required
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

  updateRecordName = name => {
    const { record } = this.props
    // method exists on Item and Collection
    record.API_updateNameAndCover({ name })
  }

  handleTitleClick = () => {
    const { record } = this.props
    if (record.isCurrentUserProfile) {
      window.open(IdeoSSO.profileUrl, '_blank')
    }
  }

  handleRestore = ev => {
    ev.preventDefault()
    const { record } = this.props
    record.restore()
  }

  handleFilterClick = ev => {
    ev.preventDefault()
  }

  handleChallengeSettingsClick = () => {
    const { uiStore } = this.props
    uiStore.update('challengeSettingsOpen', true)
  }

  handleReviewSubmissionsClick = () => {
    console.log('handle review submissions')
  }

  openMoveMenuForTemplate = e => {
    const { record } = this.props
    record.toggleTemplateHelper()
  }

  get leftIcon() {
    const { record } = this.props
    const leftConditions = [record.isProfileTemplate, record.isMasterTemplate]

    if (_.some(leftConditions, bool => bool)) {
      return (
        <IconHolder marginRight={12}>
          <CollectionTypeIcon record={record} />
        </IconHolder>
      )
    }
    return null
  }

  get rightIcon() {
    const { record } = this.props
    const rightConditions = [
      record.isUserProfile,
      record.isProfileCollection,
      record.isSubmissionBox,
      record.launchableTestId,
      record.isBoard,
    ]

    if (_.some(rightConditions, bool => bool)) {
      return (
        <IconHolder marginRight={12}>
          <CollectionTypeIcon record={record} />
        </IconHolder>
      )
    }
    return null
  }

  get collectionLabelSelector() {
    const { record } = this.props

    if (!record.allowsCollectionTypeSelector) {
      return null
    }

    return (
      <CollectionTypeSelector collection={record} location={'PageHeader'}>
        <IconHolder marginRight={12}>
          {collectionTypeToIcon({
            type: record.collection_type,
            size: 'lg',
          })}
        </IconHolder>
      </CollectionTypeSelector>
    )
  }

  get hiddenIcon() {
    const { record } = this.props
    if (!record.can_view) return null
    if (record.is_private || this.isCurrentlyHiddenSubmission) {
      return (
        <HiddenIconButton
          clickable
          size="lg"
          record={record}
          IconWrapper={({ children }) => (
            <IconHolder marginRight={12}>{children}</IconHolder>
          )}
        />
      )
    }
    return null
  }

  get collectionTypeOrInheritedTags() {
    const { record, uiStore } = this.props
    // not enough room to show in the header of a live Test
    if (record.isLiveTest) return null
    if (uiStore.windowWidth < v.responsive.medBreakpoint) return null
    if (record.isTemplated && !record.isSubTemplate) return null
    if (record.inherited_tag_list && record.inherited_tag_list.length) {
      let tagList = record.inherited_tag_list.map(tag => `#${tag}`).join(',')
      if (tagList.length > 22) {
        tagList = (
          <span>
            {tagList.slice(0, 19)}
            <span style={{ fontSize: '1rem' }}>…</span>
          </span>
        )
      }
      return <SubduedHeading1>{tagList}</SubduedHeading1>
    }
    return null
  }

  get isCurrentlyHiddenSubmission() {
    const { record } = this.props
    return record.isHiddenSubmission
  }

  get renderTestUi() {
    const { record, uiStore } = this.props
    if (record.idea_id) return
    if (
      record.isLiveTest &&
      (record.has_link_sharing ||
        record.collection_to_test_id ||
        record.is_submission_box_template_test)
    ) {
      return (
        <Fragment>
          <CopyToClipboard text={record.publicTestURL} onCopy={() => null}>
            <Button
              minWidth={v.buttonSizes.header.width}
              onClick={() =>
                uiStore.popupSnackbar({
                  message: 'Test link copied',
                })
              }
              size="sm"
              data-cy="HeaderFormButton"
              colorScheme={v.colors.black}
              outline
            >
              <StyledButtonIconWrapper>
                <LinkIconSm />
              </StyledButtonIconWrapper>
              <HeaderButtonText>Get Link</HeaderButtonText>
            </Button>
          </CopyToClipboard>
          {this.renderStopFeebackButton}
        </Fragment>
      )
    }
  }

  get renderReopenTestButton() {
    const { record, uiStore } = this.props
    if (!record.can_edit_content || !record.isClosedTest) return null
    // NOTE: this button is just for re-open, since "launch feedback"
    // appears inside of AudienceSettings
    return (
      <Button
        onClick={record.reopenTest}
        minWidth={200}
        disabled={uiStore.launchButtonLoading}
        size="sm"
        data-cy="HeaderFormButton"
        colorScheme={v.colors.black}
        outline
      >
        Re-open Feedback
      </Button>
    )
  }

  get renderSubmissionSubmitButton() {
    const { record, uiStore } = this.props
    if (!this.isCurrentlyHiddenSubmission) return null

    return (
      <Button
        colorScheme={v.colors.alert}
        onClick={record.API_submitSubmission}
        disabled={uiStore.launchButtonLoading}
        size="sm"
        data-cy="HeaderFormButton"
      >
        Submit
      </Button>
    )
  }

  get renderJoinCollectionButton() {
    const { record, routingStore } = this.props
    if (!record.isPublicJoinable) return null
    return (
      <Button
        style={{ marginLeft: '1rem' }}
        colorScheme={v.colors.primaryDarkest}
        onClick={() =>
          routingStore.routeToLogin({ redirect: record.frontendUrl })
        }
        size="sm"
        data-cy="HeaderFormButton"
      >
        Join
      </Button>
    )
  }

  get renderRestoreButton() {
    const { record } = this.props
    if (!record.can_edit) return null
    if (!record.is_restorable) return null
    return (
      <Button
        style={{ marginLeft: '1rem' }}
        colorScheme={v.colors.primaryDarkest}
        onClick={this.handleRestore}
        size="sm"
        data-cy="HeaderFormButton"
      >
        Restore
      </Button>
    )
  }

  get renderTemplateButton() {
    const { record, template } = this.props
    if (record.isUsableTemplate && record.isMasterTemplate) {
      return (
        <Button
          minWidth={v.buttonSizes.header.width}
          colorScheme={v.colors.primaryDark}
          onClick={this.openMoveMenuForTemplate}
          size="sm"
          data-cy="HeaderFormButton"
        >
          Use Template
        </Button>
      )
    } else if (
      template &&
      !record.isMasterTemplate &&
      !record.isSubTemplate &&
      !record.isTestCollection &&
      record.isTemplated
    ) {
      const active = template.can_view || template.anyone_can_view
      return (
        <Button
          ref={ref => {
            this.templateButtonRef = ref
          }}
          onClick={e => {
            // prevent other header clicks like handleTitleClick
            e.stopPropagation()
            this.props.routingStore.routeTo('collections', record.template_id)
            // this same button remains mounted after the route, blur to remove focus
            if (this.templateButtonRef) this.templateButtonRef.blur()
          }}
          minWidth={v.buttonSizes.header.width + 40}
          size="sm"
          data-cy="HeaderFormButton"
          colorScheme={v.colors.commonDark}
          outline
          disabled={!active}
        >
          <StyledButtonIconWrapper float={'left'}>
            <CollectionTypeIcon record={record} />
          </StyledButtonIconWrapper>
          <HeaderButtonText fixedWidth={active} large>
            <TruncatableText
              text={template.name}
              maxLength={v.maxButtonTextLength}
            />
          </HeaderButtonText>
          {active && (
            <Tooltip
              classes={{ tooltip: 'Tooltip' }}
              title={'go to master template'}
              placement="top"
            >
              <StyledButtonIconWrapper width={24} float={'right'}>
                <BackIcon />
              </StyledButtonIconWrapper>
            </Tooltip>
          )}
        </Button>
      )
    }

    return null
  }

  get renderStopFeebackButton() {
    const { record, uiStore } = this.props
    if (
      record.can_edit_content &&
      !record.is_test_locked &&
      record.isLiveTest
    ) {
      return (
        <Button
          minWidth={170}
          onClick={record.closeTest}
          disabled={uiStore.launchButtonLoading}
          size="sm"
          data-cy="HeaderFormButton"
          colorScheme={v.colors.black}
          outline
        >
          Stop Feedback
        </Button>
      )
    }
    return null
  }

  get renderTopRightButton() {
    const { record } = this.props

    let buttonProps = {}
    if (!record.isSubmissionBox) {
      buttonProps = {
        name: 'Challenge Settings',
        onClick: this.handleReviewSubmissionsClick,
      }
    } else {
      // TODO: add check if the user can review the submission
      const hidden = false
      buttonProps = {
        name: `Review Submissions (${record.countSubmissionLiveTests})`,
        color: `${v.colors.alert}`,
        onClick: this.handleReviewSubmissionsClick,
        hidden,
      }
    }
    return <TopRightChallengeButton {...buttonProps} />
  }

  get cardsForTagging() {
    const { apiStore, record } = this.props
    if (apiStore.selectedCards.length > 0) {
      return apiStore.selectedCards
    } else {
      return [record.parent_collection_card]
    }
  }

  render() {
    const { record, uiStore, routingStore } = this.props
    const tagEditorOpen =
      record.parent_collection_card &&
      uiStore.tagsModalOpenId === record.parent_collection_card.id

    const rolesRecord = uiStore.rolesMenuOpen ? uiStore.rolesMenuOpen : record

    return (
      <StyledHeader
        pageHeader
        data-empty-space-click
        bottomPadding={record.isCollection ? 0.2 : 1.875}
      >
        <MaxWidthContainer>
          <RolesModal record={rolesRecord} open={!!uiStore.rolesMenuOpen} />
          {record.isInsideAChallenge && (
            <ChallengeSubHeader
              challengeName={record.challenge.name}
              challengeNavigationHandler={() => {
                routingStore.routeTo('collections', record.challenge.id)
              }}
            />
          )}
          <div style={{ minHeight: '72px' }}>
            <StyledTitleAndRoles
              data-empty-space-click
              className={record.isCurrentUserProfile ? 'user-profile' : ''}
              justify="space-between"
            >
              <Flex
                wrap
                align="center"
                className="title"
                onClick={this.handleTitleClick}
              >
                {this.leftIcon}
                <EditableName
                  name={record.name}
                  updateNameHandler={this.updateRecordName}
                  canEdit={this.canEdit}
                  extraWidth={this.iconAndTagsWidth}
                  fieldName="recordName"
                />
                {/* Can't use <Flex> if we want to attach refs... */}
                <div
                  style={{ display: 'flex' }}
                  ref={ref => {
                    this.updateIconAndTagsWidth(ref)
                  }}
                >
                  {this.rightIcon}
                  {this.collectionLabelSelector}
                  {this.hiddenIcon}
                  {record.isLiveTest && (
                    <LiveTestIndicator>Live</LiveTestIndicator>
                  )}
                  {this.collectionTypeOrInheritedTags}
                </div>
                <HeaderButtonContainer>
                  {record.isChallengeOrInsideChallenge && (
                    <ChallengePhasesIcons collection={record} />
                  )}
                  {this.renderTemplateButton}
                  {this.renderRestoreButton}
                  {this.renderSubmissionSubmitButton}
                  {this.renderReopenTestButton}
                  {this.renderJoinCollectionButton}
                  {this.renderTestUi}
                </HeaderButtonContainer>
              </Flex>

              {record.show_language_selector && (
                <FixedRightContainer>
                  <LanguageSelector />
                </FixedRightContainer>
              )}

              {record.isChallengeOrInsideChallenge && (
                <FixedRightContainer>
                  {this.renderTopRightButton}
                </FixedRightContainer>
              )}
            </StyledTitleAndRoles>
            {(record.isRegularCollection || record.isSubmissionsCollection) && (
              <CollectionFilter collection={record} canEdit={this.canEdit} />
            )}
          </div>
        </MaxWidthContainer>
        <CollectionCardsTagEditorModal
          canEdit={this.canEdit}
          cards={this.cardsForTagging}
          open={tagEditorOpen}
        />
      </StyledHeader>
    )
  }
}

PageHeader.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  template: MobxPropTypes.objectOrObservableObject,
}

PageHeader.defaultProps = {
  template: null,
}

PageHeader.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default PageHeader
