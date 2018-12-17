import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'
import Hypher from 'hypher'
import english from 'hyphenation.en-us'

import v from '~/utils/variables'
import PlainLink from '~/ui/global/PlainLink'
import { CardHeading } from '~/ui/global/styled/typography'
import hexToRgba from '~/utils/hexToRgba'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import { FormButton, RoundPill } from '~/ui/global/styled/forms'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import { questionTitle } from '~/ui/test_collections/shared'
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
    return `${props.gridW * 2 - props.gutter * 1}px`
  } else if (props.width > 1) {
    return `${props.gridW - props.gutter * 2}px`
  }
  return `calc(100% - ${props.gutter * 2}px)`
}

const calcSectionHeight = props => {
  if (props.height > 1) {
    return `calc(50% - ${pad + props.gutter / 2}px)`
  }
  return `calc(50% - ${pad}px)`
}

const StyledCardContent = styled.div`
  .overlay {
    position: absolute;
    right: 0;
    top: 0;
    background: ${hexToRgba(v.colors.black, 0.4)};
    width: 100%;
    height: 100%;
  }
  .top,
  .bottom {
    position: absolute;
    right: 1.5rem;
    width: ${props => calcSectionWidth(props)};
    height: ${props => calcSectionHeight(props)};
  }
  .top {
    top: ${props => props.gutter / 2 + pad}px;
  }
  .bottom {
    bottom: ${props => (props.height === 1 ? 6 : pad)}px;
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

    const orderName = questionTitle(order)
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

  handleClick = e => {
    const { dragging, uiStore } = this.props
    const makingSelection =
      (e.metaKey || e.ctrlKey || e.shiftKey) && uiStore.selectedCardIds.length
    if (dragging || makingSelection) {
      e.preventDefault()
      return false
    }
    return true
  }

  render() {
    const { height, width, collection, uiStore, onClick } = this.props
    const { cover } = collection
    const { gridW, gutter } = uiStore.gridSettings

    return (
      <StyledCollectionCover
        data-cy="CollectionCover"
        url={cover.image_url}
        isSpecialCollection={collection.isSpecialCollection}
        // onClick can be null, is used by SearchResultsInfinite
        onClick={onClick}
      >
        <StyledCardContent
          height={height}
          width={width}
          gutter={gutter}
          gridW={gridW}
        >
          <div className="overlay" />
          <div className="top">
            <PositionedCardHeading>
              <Dotdotdot clamp={height > 1 ? 6 : 3}>
                <PlainLink
                  className="no-select cancelGridClick"
                  onClick={this.handleClick}
                  to={routingStore.pathTo('collections', collection.id)}
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
        </StyledCardContent>
      </StyledCollectionCover>
    )
  }
}

CollectionCover.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  inSubmissionsCollection: PropTypes.bool,
  dragging: PropTypes.bool,
  onClick: PropTypes.func,
}
CollectionCover.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionCover.defaultProps = {
  inSubmissionsCollection: false,
  dragging: false,
  onClick: null,
}

CollectionCover.displayName = 'CollectionCover'

export default CollectionCover
