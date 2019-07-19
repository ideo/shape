import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'
import Hypher from 'hypher'
import english from 'hyphenation.en-us'

import FilestackUpload from '~/utils/FilestackUpload'
import v from '~/utils/variables'
import PlainLink from '~/ui/global/PlainLink'
import { CardHeading } from '~/ui/global/styled/typography'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import TextItemCover from '~/ui/grid/covers/TextItemCover'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import { FormButton, RoundPill } from '~/ui/global/styled/forms'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import { routingStore } from '~/stores'

const IconHolder = styled.span`
  display: inline-block;
  line-height: 31px;
  margin-right: 5px;
  vertical-align: middle;
  width: 27px;
`

const LaunchButton = FormButton.extend`
  font-size: 0.9rem;
  padding: 0 1rem;
  width: auto;
  background-color: ${v.colors.alert};
  &:hover {
    background-color: ${v.colors.tertiaryMedium};
  }
`
LaunchButton.displayName = 'LaunchButton'

const StyledCollectionCover = styled.div`
  width: 100%;
  height: 100%;
  background: ${props =>
    props.isSpecialCollection ? v.colors.offset : v.colors.commonMedium};
  color: white;
  position: relative;
  overflow: hidden;
  ${props =>
    props.url &&
    `
    background-image: url(${props.url});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: white;
  `};
`
StyledCollectionCover.displayName = 'StyledCollectionCover'

const pad = 16
const calcSectionWidth = props => {
  if (props.width === 4) {
    return `${props.gridW * 2 - props.gutter * 2}px`
  } else if (props.width === 3) {
    return `${props.gridW * 1.6 - props.gutter * 1.6}px`
  } else if (props.width > 1) {
    return `${props.gridW - props.gutter * 3}px`
  }
  return `calc(100% - ${props.gutter * 3}px)`
}

const calcSectionHeight = props => {
  if (props.isTextItem) return '160px;'
  if (props.height > 1) {
    return `calc(50% - ${pad + props.gutter / 2}px)`
  }
  return `calc(50% - ${pad}px)`
}

const StyledCardContent = styled.div`
  .top,
  .bottom {
    color: white;
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    letter-spacing: 0;
    line-height: 1.375rem;

    position: absolute;
    right: 1.5rem;
    width: ${props => calcSectionWidth(props)};
    height: ${props => calcSectionHeight(props)};

    // Text style for the text and media covers
    h1 {
      color: white;
    }

    &.text-item {
      a {
        color: ${v.colors.ctaPrimary};
        text-decoration: none;
      }
    }
  }
  .top {
    top: ${props => (props.isTextItem ? 'auto' : props.gutter / 2 + pad)}px;
    bottom: ${props => (props.isTextItem ? '13px' : 'auto')};
  }
  .bottom {
    bottom: ${props => (props.height === 1 ? 4 : pad)}px;
  }
  ${props =>
    props.width > 1 &&
    `
    top: 33%;
    left: 40%;
    padding-right: 2rem;
  `};
`
StyledCardContent.displayName = 'StyledCardContent'

const PositionedCardHeading = CardHeading.extend`
  bottom: 0;
  position: absolute;
`

function splitName(name) {
  return name.split(' ')
}

const Hyphy = new Hypher(english)
function hyphenate(namePart) {
  const hyphenated = Hyphy.hyphenateText(namePart, 14)
  // u00AD is the "soft" hyphenation character Hypher uses
  if (!hyphenated.includes('\u00AD')) return namePart
  const parts = hyphenated.split('\u00AD')
  return `${parts.slice(0, -1).join('')}\u00AD${parts.slice(-1)}`
}

function namePartTooLong(fullName) {
  const parts = fullName.split(' ')
  return parts.some(part => part.length > 14)
}

@inject('uiStore')
@observer
class CollectionCover extends React.Component {
  get hasIcon() {
    const { collection } = this.props
    return (
      collection.isTemplated ||
      collection.isMasterTemplate ||
      collection.isSubmissionBox ||
      collection.isTestCollectionOrTestDesign
    )
  }

  get name() {
    const { collection } = this.props
    const tooLong = namePartTooLong(collection.name)
    const hyphens = tooLong ? 'auto' : 'initial'
    if (this.hasIcon) {
      const nameParts = splitName(collection.name)
      if (!nameParts) return collection.name
      const lastName = nameParts.pop()
      let leftIcon
      let rightIcon
      if (collection.isProfileTemplate) {
        rightIcon = <FilledProfileIcon />
      } else if (collection.isMasterTemplate) {
        leftIcon = <TemplateIcon circled filled />
      } else if (collection.isUserProfile) {
        rightIcon = <ProfileIcon />
      } else if (collection.isTemplated) {
        rightIcon = <TemplateIcon circled />
      } else if (collection.isSubmissionBox) {
        rightIcon = <SubmissionBoxIconLg />
      } else if (collection.isTestCollectionOrTestDesign) {
        rightIcon = <TestCollectionIcon />
      }
      return (
        <span style={{ hyphens }}>
          {leftIcon && <IconHolder>{leftIcon}</IconHolder>}
          {nameParts.join(' ')}{' '}
          <span style={{ hyphens: tooLong ? 'auto' : 'initial' }}>
            {hyphenate(lastName)}
            &nbsp;
            {rightIcon && <IconHolder>{rightIcon}</IconHolder>}
          </span>
        </span>
      )
    }
    return <span style={{ hyphens }}>{collection.name}</span>
  }

  get hasCollectionScore() {
    const { uiStore, inSubmissionsCollection } = this.props
    // scores only apply to cards within a SubmissionsCollection
    if (!inSubmissionsCollection) return false
    const order = uiStore.collectionCardSortOrder
    return order === 'total' || order.indexOf('question_') > -1
  }

  get collectionScore() {
    const { collection, uiStore } = this.props
    const order = uiStore.collectionCardSortOrder
    // don't display score for ordering like 'updated_at'
    if (!this.hasCollectionScore) return ''

    const orderName = order.question_title
    const score = collection.test_scores[order]
    return (
      <RoundPill>
        Result: {orderName}: <strong>{score}%</strong>
      </RoundPill>
    )
  }

  get hasLaunchTestButton() {
    const { collection } = this.props
    // This button only appears for tests inside submissions
    if (!collection.is_inside_a_submission) return false
    return (
      collection.launchableTestId === collection.id &&
      // if it's live you have the option to close
      // otherwise it must be launchable to see a launch or re-open button
      (collection.isLiveTest || collection.launchable)
    )
  }

  get launchTestButton() {
    const { collection, uiStore } = this.props
    if (!this.hasLaunchTestButton) return ''
    let launchCollection = collection.launchTest
    let buttonText = 'Start Feedback'
    if (collection.isLiveTest) {
      buttonText = 'Stop Feedback'
      launchCollection = collection.closeTest
    } else if (collection.isClosedTest) {
      buttonText = 'Re-open Feedback'
      launchCollection = collection.reopenTest
    }

    return (
      <LaunchButton
        className="cancelGridClick"
        onClick={launchCollection}
        disabled={uiStore.launchButtonLoading}
      >
        {buttonText}
      </LaunchButton>
    )
  }

  get coverImageUrl() {
    const { cover } = this.props.collection
    if (cover.image_handle) {
      return FilestackUpload.imageUrl({
        handle: cover.image_handle,
      })
    }
    return cover.image_url
  }

  handleClick = e => {
    const { searchResult, dragging, uiStore, collection } = this.props
    const makingSelection =
      (e.metaKey || e.ctrlKey || e.shiftKey) && uiStore.selectedCardIds.length
    if (dragging || makingSelection) {
      e.preventDefault()
      return false
    }

    if (collection.can_view || searchResult) return true

    // User does not have permission to see collection
    e.preventDefault()
    e.stopPropagation()
    uiStore.showPermissionsAlert()
    return false
  }

  render() {
    const {
      height,
      width,
      collection,
      searchResult,
      uiStore,
      textItem,
      cardId,
    } = this.props
    const { cover } = collection
    const { gridW, gutter } = uiStore.gridSettings

    return (
      <StyledCollectionCover
        data-cy="CollectionCover"
        url={this.coverImageUrl}
        isSpecialCollection={collection.isSpecialCollection}
      >
        <StyledCardContent
          height={height}
          width={width}
          gutter={gutter}
          gridW={gridW}
          isTextItem={!!textItem}
        >
          <div className="overlay" />
          {textItem ? (
            <div className="top text-item">
              <TextItemCover
                item={textItem}
                height={height}
                dragging={false}
                cardId={cardId}
                handleClick={this.handleClick}
                searchResult={searchResult}
                initialFontTag={'P'}
                hideReadMore
                uneditable
              />
            </div>
          ) : (
            <div>
              <div className="top">
                <PositionedCardHeading>
                  <Dotdotdot clamp={height > 1 ? 6 : 3}>
                    <PlainLink
                      className="no-select cancelGridClick"
                      onClick={this.handleClick}
                      to={routingStore.pathTo('collections', collection.id)}
                      data-cy="collection-cover-link"
                    >
                      {this.name}
                    </PlainLink>
                  </Dotdotdot>
                </PositionedCardHeading>
              </div>
              <div className="bottom">
                {this.launchTestButton}
                {this.collectionScore}
                {!this.hasLaunchTestButton && (
                  <Dotdotdot clamp={this.hasCollectionScore ? 2 : 3}>
                    {cover.text}
                  </Dotdotdot>
                )}
              </div>
            </div>
          )}
        </StyledCardContent>
      </StyledCollectionCover>
    )
  }
}

CollectionCover.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  cardId: PropTypes.string.isRequired,
  inSubmissionsCollection: PropTypes.bool,
  dragging: PropTypes.bool,
  searchResult: PropTypes.bool,
  textItem: MobxPropTypes.objectOrObservableObject,
}
CollectionCover.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionCover.defaultProps = {
  width: 1,
  height: 1,
  inSubmissionsCollection: false,
  dragging: false,
  searchResult: false,
  textItem: null,
}

CollectionCover.displayName = 'CollectionCover'

export default CollectionCover
