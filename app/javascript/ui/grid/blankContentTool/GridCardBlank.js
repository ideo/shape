import _ from 'lodash'
import PropTypes from 'prop-types'
import { runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex } from 'reflexbox'
import googleTagManager from '~/vendor/googleTagManager'

import CollectionIcon from '~/ui/icons/htc/CollectionIcon'
import FeedbackIcon from '~/ui/icons/htc/FeedbackIcon'
import FileIcon from '~/ui/icons/htc/FileIcon'
import FoamcoreIcon from '~/ui/icons/htc/FoamcoreIcon'
import LinkIcon from '~/ui/icons/htc/LinkIcon'
import ReportIcon from '~/ui/icons/htc/ReportIcon'
import SearchCollectionIcon from '~/ui/icons/htc/SearchCollectionIcon'
import SubmissionBoxIcon from '~/ui/icons/htc/SubmissionBoxIcon'
import TemplateIcon from '~/ui/icons/htc/TemplateIcon'
import TextIcon from '~/ui/icons/htc/TextIcon'
import VideoIcon from '~/ui/icons/htc/VideoIcon'

import CloudIcon from '~/ui/icons/CloudIcon'
import { CloseButton } from '~/ui/global/styled/buttons'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import Item from '~/stores/jsonApi/Item'
import { DisplayText } from '~/ui/global/styled/typography'
import FilestackUpload from '~/utils/FilestackUpload'
import InlineLoader from '~/ui/layout/InlineLoader'
import PopoutMenu from '~/ui/global/PopoutMenu'
import { StyledGridCard } from '~/ui/grid/shared'
import v, { ITEM_TYPES, EVENT_SOURCE_TYPES } from '~/utils/variables'

import CollectionCreator from './CollectionCreator'
import LinkCreator from './LinkCreator'
import DataItemCreator from './DataItemCreator'
import BctButtonBox from './BctButtonBox'
import { calculatePopoutMenuOffset } from '~/utils/clickUtils'

const StyledGridCardBlank = styled(StyledGridCard)`
  user-select: none;
  background-color: transparent;
  cursor: auto;
  position: relative;
  .BctButtonBox {
    cursor: pointer;
    border: none;
    margin-left: 20px;
    margin-right: 20px;
    transition: all 200ms;
  }
  ${props =>
    props.boxShadow &&
    !props.isReplacing &&
    `
    box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.1);
    background-color: ${v.colors.commonLight};
  `};
  ${props =>
    props.zoomScale &&
    `
    transform: scale(${props.zoomScale});
  `}
`
StyledGridCardBlank.displayName = 'StyledGridCardBlank'

// width of card is constrained by gridW
// vertical position is adjusted by gridH / 2 if card is 2 rows tall
const StyledGridCardInner = styled.div`
  max-width: ${props => props.gridW}px;
  margin: 0 auto;
  position: relative;
  top: ${props => (props.height > 1 ? props.gridH / 2 : 0)}px;
`
const StyledBlankCreationTool = styled.div`
  padding: 2rem;
  padding-top: 3rem;
  position: relative;
  .foreground {
    position: relative;
    z-index: ${v.zIndex.gridCard};
    left: auto;
    width: 100%;
    &.foreground-bottom {
      top: 120px;
      margin: 0 auto;
    }
  }
  .card-menu.open {
    /* because the BCTBoxes flex, we have to restrict the CardMenu when the PopoutMenu is open */
    max-width: 47px;
  }

  /* handle "small 4-col" layout i.e. layoutSize == 3, except on Foamcore */
  ${props =>
    !props.board &&
    `
      @media only screen and (min-width: ${v.responsive.medBreakpoint}px) and (max-width: ${v.responsive.largeBreakpoint}px) {
        padding: 1.5rem 1.33rem;

        .foreground.foreground-bottom {
          top: 80px;
        }

        .bct-background {
          width: 135px;
          height: 135px;
          left: 50px;
        }
        .bct-dropzone {
          width: 135px;
          left: 50px;
          .text {
            top: 35px;
            left: 28px;
            font-size: 0.8rem;
          }
          .fsp-drop-pane__container {
            width: 120px;
            height: 120px;
          }
        }
      }
    }

  `};
`

const DropzoneIconHolder = styled.div`
  color: ${v.colors.secondaryMedium};
  text-align: center;
  width: 100%;

  .icon {
    color: ${v.colors.secondaryMedium};
    height: 35px;
    width: 52px;
  }
`

@inject('uiStore', 'apiStore')
@observer
class GridCardBlank extends React.Component {
  constructor(props) {
    super(props)
    const { preselected } = props
    this.state = {
      creating: preselected || null,
      loading: false,
      bctMenuOpen: false,
      bctMenuOffsetPosition: null,
      uploaded: false,
    }
  }

  componentDidMount() {
    if (this.props.preselected === 'text') {
      this.createTextItem()
    }
    if (this.props.preselected === 'file') {
      this.pickImages()
    }
  }

  componentWillUnmount() {
    this.canceled = true
  }

  get replacingId() {
    const { uiStore, replacingId } = this.props
    if (replacingId) return replacingId
    return uiStore.blankContentToolState.replacingId
  }

  get emptyState() {
    const { uiStore } = this.props
    return uiStore.blankContentToolState.emptyCollection && !this.state.creating
  }

  startCreating = type => () => {
    this.setState({ creating: type, bctMenuOpen: false })
  }

  createCardWith = (file, idx = 0) => {
    const { uiStore } = this.props
    let { row, col, order } = uiStore.blankContentToolState
    order += idx
    if (row !== null && col !== null) {
      col += idx % 4
      row += Math.floor(idx / 4)
    }

    const attrs = {
      row,
      col,
      order,
      item_attributes: {
        type: ITEM_TYPES.FILE,
        filestack_file_attributes: {
          url: file.url,
          handle: file.handle,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          docinfo: file.docinfo,
        },
      },
    }
    this.createCard(attrs, {
      afterCreate: this.afterCreate(ITEM_TYPES.FILE),
    })
  }

  afterCreate = type => {
    return card => {
      googleTagManager.push({
        event: 'formSubmission',
        formType: `Create ${type}`,
        parentType: this.props.parent.isBoard ? 'foamcore' : 'anywhere',
      })

      if (type === ITEM_TYPES.TEXT) {
        const { uiStore } = this.props
        uiStore.setTextEditingCard(card)
      }
    }
  }

  createDefaultReportCard = () => {
    this.createCard({
      item_attributes: {
        type: ITEM_TYPES.DATA,
        name: 'Report',
        report_type: 'report_type_collections_and_items',
        datasets_attributes: {
          0: {
            chart_type: 'area',
            measure: 'participants',
            timeframe: 'ever',
          },
        },
      },
      afterCreate: this.afterCreate(ITEM_TYPES.DATA),
    })
  }

  pickImages = () => {
    const { replacingId } = this
    const filestackMethod = !replacingId
      ? FilestackUpload.pickImages
      : FilestackUpload.pickImage
    filestackMethod({
      onClose: () => {
        if (!this.state.uploaded) this.closeBlankContentTool()
      },
      onFileUploadFinished: () => {
        this.setState({ uploaded: true })
      },
      onSuccess: fileData => {
        const files = _.isArray(fileData) ? fileData : [fileData]
        _.each(files, (file, idx) => {
          this.createCardWith(file, idx)
        })
      },
    })
  }

  get replacingTestCollectionMedia() {
    const { testCollectionCard } = this.props
    if (!testCollectionCard) return false
    const { record } = testCollectionCard
    return record && record.type !== 'Item::QuestionItem'
  }

  createCard = (nested = {}, options = {}) => {
    const { replacingId } = this
    const {
      afterCreate,
      parent,
      testCollectionCard,
      defaultShowWholeImage,
      apiStore,
      uiStore,
    } = this.props
    const { order, row, col, width, height } = uiStore.blankContentToolState
    const isReplacing = !!replacingId
    const attrs = {
      order,
      width,
      height,
      row,
      col,
      // `parent` is the collection this card belongs to
      parent_id: parent.id,
      image_contain: defaultShowWholeImage,
    }

    // apply nested attrs
    Object.assign(attrs, nested)
    if (testCollectionCard) {
      const { record } = testCollectionCard
      const item_attributes = {
        question_type: record.question_type,
      }
      if (record.name) item_attributes.name = record.name
      if (record.content) item_attributes.content = record.content
      const existingAttrs = {
        order: testCollectionCard.order,
        item_attributes: {
          ...attrs.item_attributes,
          ...item_attributes,
        },
      }
      Object.assign(attrs, existingAttrs)
    }

    const card = new CollectionCard(attrs, apiStore)
    card.parent = parent // Assign parent so store can get access to it
    if (
      attrs.item_attributes &&
      attrs.item_attributes.type === ITEM_TYPES.TEXT
    ) {
      const item = new Item(attrs.item_attributes, apiStore)
      runInAction(() => {
        item.can_edit_content = true
        item.class_type = ITEM_TYPES.TEXT
        card.record = item
        // Creates a temporary card for the user to edit
        parent.tempTextCard = card
        // unset this so it does not call placeholderCard.API_destroy() when closing BCT
        uiStore.setBctPlaceholderCard(null)
        uiStore.closeBlankContentTool({ force: true })
      })
      // For text cards to be available immediately, don't await this
      card.API_create()
      if (afterCreate) afterCreate(card)
      if (options.afterCreate) options.afterCreate(card)
      return
    }

    this.setState({ loading: true, uploaded: false }, async () => {
      let newCard
      if (isReplacing) {
        newCard = await card.API_replace({ replacingId })
      } else {
        newCard = await card.API_create()
      }
      // afterCreate can come passed down from props
      if (afterCreate) afterCreate(newCard)
      // or separately from the createCard action (e.g. CollectionCreator)
      if (options.afterCreate) options.afterCreate(newCard)
      // NOTE: closeBlankContentTool() will automatically get called
      // in CollectionCard after the async actions are complete
    })
  }

  createTextItem = () => {
    // prevent multiple clicks (or pressing enter) to create multiple items
    if (this.state.loading) {
      return
    }
    this.createCard(
      {
        item_attributes: {
          name: 'Text',
          content: '',
          quill_data: { ops: [] },
          type: ITEM_TYPES.TEXT,
        },
      },
      {
        afterCreate: this.afterCreate(ITEM_TYPES.TEXT),
      }
    )
  }

  closeBlankContentTool = () => {
    const { apiStore, testCollectionCard, preselected, uiStore } = this.props
    if (!!this.replacingId) {
      const card = apiStore.find('collection_cards', this.replacingId)
      if (card) {
        card.stopReplacing()
      }
    }
    if (
      testCollectionCard ||
      (uiStore.blankContentToolState.emptyCollection && !preselected)
    ) {
      this.setState({ creating: null })
    } else {
      uiStore.closeBlankContentTool()
    }
  }

  toggleBctMenu = e => {
    const { bctMenuOpen } = this.state
    const { offsetX, offsetY } = calculatePopoutMenuOffset(
      e,
      EVENT_SOURCE_TYPES.BCT_MENU
    )
    if (bctMenuOpen) {
      this.setState({
        bctMenuOpen: false,
        bctMenuOffsetPosition: null,
      })
    } else {
      this.setState({
        bctMenuOpen: true,
        bctMenuOffsetPosition: { x: offsetX, y: offsetY },
      })
    }
  }

  renderInner = () => {
    let inner
    const { parent } = this.props
    const { isBoard } = parent
    const { creating, loading } = this.state
    const isReplacing = !!this.replacingId
    const size = v.iconSizes.bct

    switch (creating) {
      case 'collection':
      case 'testCollection':
      case 'template':
      case 'submissionBox':
      case 'foamcoreBoard':
      case 'searchCollection':
        inner = (
          <CollectionCreator
            type={creating}
            loading={loading}
            createCard={this.createCard}
            closeBlankContentTool={this.closeBlankContentTool}
          />
        )
        break
      case 'video':
        inner = (
          <LinkCreator
            type="video"
            loading={loading}
            createCard={this.createCard}
            closeBlankContentTool={this.closeBlankContentTool}
          />
        )
        break
      case 'link':
        inner = (
          <LinkCreator
            type="link"
            loading={loading}
            createCard={this.createCard}
            closeBlankContentTool={this.closeBlankContentTool}
          />
        )
        break
      case 'report':
        inner = (
          <DataItemCreator
            loading={loading}
            createCard={this.createCard}
            closeBlankContentTool={this.closeBlankContentTool}
          />
        )
        break
      default:
        inner = null
    }

    const testBctBox = (
      <BctButtonBox
        tooltip="Get feedback"
        type="testCollection"
        creating={creating}
        size={size}
        onClick={this.startCreating('testCollection')}
        Icon={() => <FeedbackIcon />}
      />
    )
    const submissionBctBox = (
      <BctButtonBox
        tooltip="Create submission box"
        type="submissionBox"
        creating={creating}
        size={size}
        onClick={this.startCreating('submissionBox')}
        Icon={SubmissionBoxIcon}
      />
    )
    const foamcoreBoardBctBox = (
      <BctButtonBox
        tooltip="Create foamcore board"
        type="foamcoreBoard"
        creating={creating}
        size={size}
        onClick={this.startCreating('foamcoreBoard')}
        Icon={FoamcoreIcon}
      />
    )
    const searchCollectionBctBox = (
      <BctButtonBox
        tooltip="Create search collection"
        type="searchCollection"
        creating={creating}
        size={size}
        onClick={this.startCreating('searchCollection')}
        Icon={SearchCollectionIcon}
      />
    )
    const collectionBctBox = (
      <BctButtonBox
        tooltip="Create collection"
        type="collection"
        creating={creating}
        size={size}
        onClick={this.startCreating('collection')}
        Icon={CollectionIcon}
      />
    )

    return (
      <StyledBlankCreationTool
        board={isBoard}
        replacing={isReplacing && !creating}
      >
        <Flex className="foreground" justify="center">
          {/* First row of options */}
          {!isReplacing && !creating && (
            <BctButtonBox
              tooltip="Add text box"
              type="text"
              creating={creating}
              size={size}
              onClick={this.createTextItem}
              Icon={TextIcon}
            />
          )}
          {(!creating || creating === 'file') && (
            <BctButtonBox
              tooltip="Add file"
              type="file"
              creating={creating}
              size={size}
              onClick={this.pickImages}
              Icon={FileIcon}
            />
          )}
          {(!creating || creating === 'link') && (
            <BctButtonBox
              tooltip="Add URL"
              type="link"
              creating={creating}
              size={size}
              onClick={this.startCreating('link')}
              Icon={LinkIcon}
            />
          )}
          {(!creating || creating === 'video') && (
            <BctButtonBox
              tooltip="Link video"
              type="video"
              creating={creating}
              size={size}
              onClick={this.startCreating('video')}
              Icon={VideoIcon}
            />
          )}
          {/*
            NOTE: somewhat legacy artifact, but we only need these BCTBoxes
            so that you see the correct icon after making your collection type selection
          */}
          {creating === 'collection' && collectionBctBox}
          {creating === 'foamcoreBoard' && foamcoreBoardBctBox}
          {creating === 'submissionBox' && submissionBctBox}
          {creating === 'testCollection' && testBctBox}
          {creating === 'searchCollection' && searchCollectionBctBox}
          {creating === 'report' && (
            <BctButtonBox
              type="data"
              creating={creating}
              size={size}
              Icon={() => <ReportIcon size="large" />}
            />
          )}
          {creating === 'template' && (
            <BctButtonBox
              type="template"
              creating={creating}
              size={size}
              Icon={TemplateIcon}
            />
          )}
        </Flex>
        {/* Second row display on initial load */}
        {!isReplacing && !creating && (
          <Flex
            className="foreground foreground-bottom"
            justify="space-between"
          >
            {collectionBctBox}
            {foamcoreBoardBctBox}
            {testBctBox}
            <PopoutMenu
              width={240}
              buttonStyle="bct"
              menuOpen={this.state.bctMenuOpen}
              onClick={this.toggleBctMenu}
              wrapText
              direction="right"
              menuItems={[
                {
                  name: 'Create Submission Box',
                  iconLeft: <SubmissionBoxIcon />,
                  onClick: this.startCreating('submissionBox'),
                },
                {
                  name: 'Create Template',
                  iconLeft: <TemplateIcon />,
                  onClick: this.startCreating('template'),
                },
                {
                  name: 'Create Search Collection',
                  iconLeft: <SearchCollectionIcon size="xs" />,
                  onClick: this.startCreating('searchCollection'),
                },
                {
                  name: 'Create Report',
                  iconLeft: <ReportIcon />,
                  onClick: this.createDefaultReportCard,
                },
              ]}
              offsetPosition={this.state.bctMenuOffsetPosition}
            />
          </Flex>
        )}
        {inner}
      </StyledBlankCreationTool>
    )
  }

  render() {
    const { testCollectionCard, uiStore, parent } = this.props
    const { gridSettings, blankContentToolState } = uiStore
    const { creating, loading } = this.state
    const { isBoard } = parent
    const isReplacing = !!this.replacingId
    let { gridW, gridH } = gridSettings
    if (isBoard) {
      ;({ gridW, gridH } = v.defaultGridSettings)
    }
    const showCloseButton =
      !this.emptyState &&
      (!testCollectionCard || creating || this.replacingTestCollectionMedia)

    let zoomScale = 0
    if (!loading && uiStore.zoomLevel > 2) zoomScale = uiStore.zoomLevel / 1.5
    return (
      <StyledGridCardBlank
        boxShadow={isBoard}
        isReplacing={isReplacing && !creating}
        zoomScale={zoomScale}
      >
        <StyledGridCardInner
          height={blankContentToolState.height}
          gridW={gridW}
          gridH={gridH}
        >
          {!loading && this.renderInner()}
          {isReplacing && !creating && (
            <DropzoneIconHolder>
              <CloudIcon />
              <br />
              <DisplayText
                textTransform="uppercase"
                style={{ fontWeight: 500 }}
              >
                Drag & Drop
              </DisplayText>
            </DropzoneIconHolder>
          )}
        </StyledGridCardInner>
        {loading && <InlineLoader />}
        {showCloseButton && (
          <CloseButton
            onClick={this.closeBlankContentTool}
            data-cy="BCT-closeButton"
          />
        )}
      </StyledGridCardBlank>
    )
  }
}

GridCardBlank.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  afterCreate: PropTypes.func,
  preselected: PropTypes.string,
  replacingId: PropTypes.string,
  testCollectionCard: MobxPropTypes.objectOrObservableObject,
  defaultShowWholeImage: PropTypes.bool,
}
GridCardBlank.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
GridCardBlank.defaultProps = {
  afterCreate: null,
  preselected: null,
  replacingId: null,
  testCollectionCard: null,
  defaultShowWholeImage: false,
}

// give a name to the injected component for unit tests
GridCardBlank.displayName = 'GridCardBlank'

export default GridCardBlank
