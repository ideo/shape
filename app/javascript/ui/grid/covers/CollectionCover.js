import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action, observable } from 'mobx'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'

import FilestackUpload from '~/utils/FilestackUpload'
import v from '~/utils/variables'
import PlainLink from '~/ui/global/PlainLink'
import { CardHeading } from '~/ui/global/styled/typography'
import TextItemCover from '~/ui/grid/covers/TextItemCover'
import CarouselCover from '~/ui/grid/covers/CarouselCover'
import { FormButton } from '~/ui/global/styled/buttons'
import { RoundPill } from '~/ui/global/styled/forms'
import { routingStore } from '~/stores'
import { ACTION_SOURCES } from '~/enums/actionEnums'
import CollectionCoverTitle, {
  IconHolder,
} from '~/ui/grid/covers/CollectionCoverTitle'
import CollectionTypeSelector from '~/ui/global/CollectionTypeSelector'
import { collectionTypeToIcon } from '~/ui/global/CollectionTypeIcon'

const LaunchButton = styled(FormButton)`
  font-size: 0.9rem;
  padding: 0 1rem;
  width: auto;
  background-color: ${v.colors.alert};
  &:hover {
    background-color: ${v.colors.tertiaryMedium};
  }
`
LaunchButton.displayName = 'LaunchButton'

const CardButtonWrapper = styled.div`
  margin-left: calc(50% - ${v.buttonSizes.header.width / 2}px);
  padding-bottom: 4px;
`
CardButtonWrapper.displayName = 'CardButtonWrapper'

const UseTemplateButton = styled(FormButton)`
  border-color: white;
  color: white;
`
UseTemplateButton.displayName = 'UseTemplateButton'

const StyledCollectionCover = styled.div`
  width: 100%;
  height: 100%;
  background: ${props =>
    props.isSpecialCollection ? v.colors.offset : v.colors.collectionCover};
  color: white;
  position: relative;
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
  if (props.isTextItem) return 'auto;'
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

const PositionedCardHeading = styled(CardHeading)`
  bottom: 0;
  position: absolute;
`

@inject('uiStore', 'apiStore')
@observer
class CollectionCover extends React.Component {
  @observable
  hasEmptyCarousel = false

  openMoveMenuForTemplate = async e => {
    const { collection, uiStore, apiStore } = this.props
    // load additional data needed for moving template from card cover, ie. parent_collection_card
    await apiStore.fetch('collections', collection.id)
    uiStore.openMoveMenu({
      from: collection,
      cardAction: 'useTemplate',
      context: ACTION_SOURCES.COVER,
    })
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
    return (
      // This button only appears for tests inside submissions
      collection.is_inside_a_submission &&
      collection.launchableTestId &&
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

  get hasUseTemplateButton() {
    const { collection } = this.props
    return collection.isUsableTemplate
  }

  get numberOfLinesForDescription() {
    const { uiStore } = this.props
    // these buttons take up space so we reduce # of lines
    const reduced = this.hasUseTemplateButton || this.hasCollectionScore
    if (reduced) {
      // in smaller layout you can really only fit 1 line
      if (uiStore.gridSettings.layoutSize === 3) {
        return 1
      }
      return 2
    }
    return 3
  }

  get useTemplateButton() {
    return (
      <CardButtonWrapper>
        <UseTemplateButton
          width={v.buttonSizes.header.width}
          fontSize={v.buttonSizes.header.fontSize}
          color={'transparent'}
          onClick={this.openMoveMenuForTemplate}
          data-cy="CollectionCoverFormButton"
          className="CollectionCoverFormButton"
        >
          Use Template
        </UseTemplateButton>
      </CardButtonWrapper>
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

  @action
  setEmptyCarousel = () => {
    this.hasEmptyCarousel = true
  }

  handleClick = e => {
    // TODO is this being used?
    const { searchResult, dragging, uiStore, collection } = this.props
    const { movingCardIds } = uiStore
    const movingCard =
      movingCardIds &&
      _.includes(
        movingCardIds,
        collection.parent_collection_card &&
          collection.parent_collection_card.id
      )
    const makingSelection =
      (e.metaKey || e.ctrlKey || e.shiftKey) && uiStore.selectedCardIds.length
    if (dragging || makingSelection || movingCard) {
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

  get requiresOverlay() {
    const { collection } = this.props
    const { cover } = collection

    return !!(cover && cover.image_url)
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
    const { subtitle } = collection
    const { gridW, gutter } = uiStore.gridSettings

    return (
      <StyledCollectionCover
        data-cy="CollectionCover"
        url={this.coverImageUrl}
        isSpecialCollection={collection.isSpecialCollection}
      >
        {collection.isCarousel && !this.hasEmptyCarousel ? (
          <CarouselCover
            collection={collection}
            // trigger a reload
            updatedAt={collection.updated_at}
            dragging={false}
            handleClick={this.handleClick}
            onEmptyCarousel={this.setEmptyCarousel}
          />
        ) : (
          <StyledCardContent
            height={height}
            width={width}
            gutter={gutter}
            gridW={gridW}
            isTextItem={!!textItem}
          >
            <div className={this.requiresOverlay ? 'overlay' : ''} />
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
                  isTransparent={true}
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
                        <CollectionCoverTitle collection={collection} />
                      </PlainLink>
                      <CollectionTypeSelector
                        location={'CollectionCover'}
                        collection={collection}
                      >
                        <IconHolder>
                          {collectionTypeToIcon[collection.collection_type]}
                        </IconHolder>
                      </CollectionTypeSelector>
                    </Dotdotdot>
                    {this.button}
                  </PositionedCardHeading>
                </div>
                <div className="bottom">
                  {this.launchTestButton}
                  {this.collectionScore}
                  {this.hasUseTemplateButton && this.useTemplateButton}
                  {!this.hasLaunchTestButton && (
                    <Dotdotdot clamp={this.numberOfLinesForDescription}>
                      {subtitle}
                    </Dotdotdot>
                  )}
                </div>
              </div>
            )}
          </StyledCardContent>
        )}
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
