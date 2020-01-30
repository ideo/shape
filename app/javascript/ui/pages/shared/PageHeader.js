import { Fragment } from 'react'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'
import CopyToClipboard from 'react-copy-to-clipboard'

import EditableName from '~/ui/pages/shared/EditableName'
import RolesModal from '~/ui/roles/RolesModal'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import HiddenIconButton from '~/ui/global/HiddenIconButton'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import SystemIcon from '~/ui/icons/SystemIcon'
import LinkIconSm from '~/ui/icons/LinkIconSm'
import BackIcon from '~/ui/icons/BackIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
import CollectionCardsTagEditorModal from '~/ui/pages/shared/CollectionCardsTagEditorModal'
import { StyledHeader, MaxWidthContainer } from '~/ui/global/styled/layout'
import { FormButton } from '~/ui/global/styled/buttons'
import { SubduedHeading1 } from '~/ui/global/styled/typography'
import { StyledTitleAndRoles } from '~/ui/pages/shared/styled'
import FoamcoreBoardIcon from '~/ui/icons/FoamcoreBoardIcon'
import LanguageSelector from '~/ui/layout/LanguageSelector'
import v from '~/utils/variables'
import routeToLogin from '~/utils/routeToLogin'
import { rightClamp } from '~/utils/textUtils'
import Tooltip from '~/ui/global/Tooltip'

/* global IdeoSSO */

const IconHolder = styled.span`
  color: ${v.colors.commonDark};
  display: block;
  height: 32px;
  ${props =>
    props.align === 'left'
      ? 'margin-right: 12px;'
      : 'margin-left: 6px;'} margin-top: 12px;
  overflow: hidden;
  width: 32px;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    height: 36px;
    margin-top: 8px;
    width: 20px;
  }
`

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
`

StyledButtonIconWrapper.displayName = 'StyledButtonIconWrapper'

const StyledButtonNameWrapper = styled.span`
  display: inline-block;
  vertical-align: middle;
`

StyledButtonNameWrapper.displayName = 'StyledButtonNameWrapper'

@inject('uiStore', 'apiStore', 'routingStore')
@observer
class PageHeader extends React.Component {
  @observable
  iconAndTagsWidth = 0

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

  openMoveMenuForTemplate = e => {
    const { record } = this.props
    record.toggleTemplateHelper()
  }

  get collectionIcon() {
    const { record } = this.props
    if (record.isProfileTemplate) {
      return (
        <IconHolder align="left">
          <FilledProfileIcon />
        </IconHolder>
      )
    }
    return null
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
            <IconHolder align="right">{children}</IconHolder>
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

  get collectionTypeIcon() {
    const { record } = this.props
    let icon = ''
    if (record.isUserProfile) {
      icon = <ProfileIcon />
    } else if (record.isProfileCollection) {
      icon = <SystemIcon />
    } else if (record.isTemplated && !record.isSubTemplate) {
      icon = <TemplateIcon circled />
    } else if (record.isSubmissionBox) {
      icon = <SubmissionBoxIconLg />
    } else if (record.launchableTestId) {
      icon = <TestCollectionIcon />
    } else if (record.isBoard) {
      icon = <FoamcoreBoardIcon large />
    }
    if (icon) {
      return <IconHolder align="right">{icon}</IconHolder>
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
            <FormButton
              width={v.buttonSizes.header.width}
              onClick={() =>
                uiStore.popupSnackbar({
                  message: 'Test link copied',
                })
              }
              fontSize={v.buttonSizes.header.fontSize}
              data-cy="HeaderFormButton"
              transparent
            >
              <StyledButtonIconWrapper>
                <LinkIconSm />
              </StyledButtonIconWrapper>
              <StyledButtonNameWrapper>Get Link</StyledButtonNameWrapper>
            </FormButton>
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
      <FormButton
        onClick={record.reopenTest}
        width="200"
        disabled={uiStore.launchButtonLoading}
        fontSize={v.buttonSizes.header.fontSize}
        data-cy="HeaderFormButton"
        transparent
      >
        Re-open Feedback
      </FormButton>
    )
  }

  get renderSubmissionSubmitButton() {
    const { record, uiStore } = this.props
    if (!this.isCurrentlyHiddenSubmission) return null

    return (
      <FormButton
        color={v.colors.alert}
        onClick={record.API_submitSubmission}
        disabled={uiStore.launchButtonLoading}
        fontSize={v.buttonSizes.header.fontSize}
        data-cy="HeaderFormButton"
      >
        Submit
      </FormButton>
    )
  }

  get renderJoinCollectionButton() {
    const { record } = this.props
    if (!record.isPublicJoinable) return null
    return (
      <FormButton
        style={{ marginLeft: '1rem' }}
        color={v.colors.primaryDarkest}
        onClick={() => routeToLogin({ redirect: record.frontend_url })}
        fontSize={v.buttonSizes.header.fontSize}
        data-cy="HeaderFormButton"
      >
        Join
      </FormButton>
    )
  }

  get renderRestoreButton() {
    const { record } = this.props
    if (!record.can_edit) return null
    if (!record.is_restorable) return null
    return (
      <FormButton
        style={{ marginLeft: '1rem' }}
        color={v.colors.primaryDarkest}
        onClick={this.handleRestore}
        fontSize={v.buttonSizes.header.fontSize}
        data-cy="HeaderFormButton"
      >
        Restore
      </FormButton>
    )
  }

  get renderTemplateName() {
    const { record } = this.props
    const { template } = record
    const { maxButtonTextLength } = v
    const templateName = template ? template.name : 'Template'
    const truncatedName =
      templateName.length > maxButtonTextLength
        ? rightClamp(templateName, maxButtonTextLength)
        : templateName
    const shouldTruncate = templateName.length > maxButtonTextLength
    const buttonNameWrapper = (
      <StyledButtonNameWrapper>{truncatedName}</StyledButtonNameWrapper>
    )

    if (!shouldTruncate) {
      return buttonNameWrapper
    }

    return (
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title={template.name}
        placement="top"
      >
        {buttonNameWrapper}
      </Tooltip>
    )
  }

  get renderTemplateButton() {
    const { record } = this.props
    if (record.isUsableTemplate && record.isMasterTemplate) {
      return (
        <FormButton
          width={v.buttonSizes.header.width}
          color={v.colors.primaryDark}
          onClick={this.openMoveMenuForTemplate}
          fontSize={v.buttonSizes.header.fontSize}
          data-cy="HeaderFormButton"
        >
          Use Template
        </FormButton>
      )
    } else if (
      !record.isMasterTemplate &&
      !record.isSubTemplate &&
      !record.isTestCollection &&
      record.isTemplated
    ) {
      const { template } = record
      return (
        <FormButton
          onClick={() => {
            this.props.routingStore.routeTo('collections', record.template_id)
          }}
          fontSize={v.buttonSizes.header.fontSize}
          data-cy="HeaderFormButton"
          color={v.colors.commonMedium}
          disabled={!template.can_view && !template.anyone_can_view}
          transparent
        >
          <StyledButtonIconWrapper>
            <TemplateIcon />
          </StyledButtonIconWrapper>
          {this.renderTemplateName}
          <Tooltip
            classes={{ tooltip: 'Tooltip' }}
            title={'Go to Master Template'}
            placement="top"
          >
            <StyledButtonIconWrapper width={14}>
              <BackIcon />
            </StyledButtonIconWrapper>
          </Tooltip>
        </FormButton>
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
        <FormButton
          width="170"
          onClick={record.closeTest}
          disabled={uiStore.launchButtonLoading}
          fontSize={v.buttonSizes.header.fontSize}
          data-cy="HeaderFormButton"
          transparent
        >
          Stop Feedback
        </FormButton>
      )
    }
    return null
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
    const { record, uiStore } = this.props
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
                {this.collectionIcon}
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
                  {this.collectionTypeIcon}
                  {this.hiddenIcon}
                  {record.isLiveTest && (
                    <LiveTestIndicator>Live</LiveTestIndicator>
                  )}
                  {this.collectionTypeOrInheritedTags}
                </div>
                <HeaderButtonContainer>
                  {this.renderTemplateButton}
                  {this.renderRestoreButton}
                  {this.renderSubmissionSubmitButton}
                  {this.renderReopenTestButton}
                  {this.renderJoinCollectionButton}
                  {this.renderTestUi}
                </HeaderButtonContainer>
              </Flex>

              {record.show_language_selector && (
                <Flex
                  style={{
                    position: 'relative',
                    top: '22px',
                    right: '60px',
                    height: '33px',
                  }}
                >
                  <LanguageSelector />
                </Flex>
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
}

PageHeader.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default PageHeader
