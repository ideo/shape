import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction } from 'mobx'
import styled from 'styled-components'
import { Flex } from 'reflexbox'
import googleTagManager from '~/vendor/googleTagManager'

import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddCollectionIcon from '~/ui/icons/AddCollectionIcon'
import SearchCollectionIcon from '~/ui/icons/SearchCollectionIcon'
import AddFileIcon from '~/ui/icons/AddFileIcon'
import AddVideoIcon from '~/ui/icons/AddVideoIcon'
import AddLinkIcon from '~/ui/icons/AddLinkIcon'
import ReportIcon from '~/ui/icons/ReportIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import TestCollectionIconSm from '~/ui/icons/TestCollectionIconSm'
import SubmissionBoxIcon from '~/ui/icons/SubmissionBoxIcon'
import FoamcoreBoardIcon from '~/ui/icons/collection_icons/FoamcoreBoardIcon'
import v, { ITEM_TYPES, EVENT_SOURCE_TYPES } from '~/utils/variables'
import FilestackUpload, { MAX_SIZE } from '~/utils/FilestackUpload'
import { StyledGridCard } from '~/ui/grid/shared'
import InlineLoader from '~/ui/layout/InlineLoader'
import { CloseButton } from '~/ui/global/styled/buttons'
import bctIcons from '~/assets/bct_icons.png'
import PopoutMenu from '~/ui/global/PopoutMenu'
import CollectionCard from '~/stores/jsonApi/CollectionCard'

import CollectionCreator from './CollectionCreator'
import LinkCreator from './LinkCreator'
import DataItemCreator from './DataItemCreator'
import BctButtonBox from './BctButtonBox'
import BctButtonRotation from './BctButtonRotation'
import { calculatePopoutMenuOffset } from '~/utils/clickUtils'

const StyledGridCardBlank = styled(StyledGridCard)`
  user-select: none;
  background-color: transparent;
  cursor: auto;
  position: relative;
  button {
    cursor: pointer;
    border: none;
    transition: all 200ms;
  }
  ${props =>
    props.boxShadow &&
    `
    box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.1);
    background-color: ${v.colors.commonLight};
  `};
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
  padding-top: 1rem;
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
  transition: ${v.transitionWithDelay};

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

const BctBackground = styled.div`
  z-index: ${v.zIndex.gridCardBg};
  position: absolute;
  top: 40px;
  left: 60px;
  width: 175px;
  height: 175px;
  border-radius: 50%;
  border: 8px solid ${v.colors.primaryLight};
  background: ${v.colors.primaryLightest};
  transition: ${v.transitionWithDelay};
`
BctBackground.displayName = 'BctBackground'

const BctDropzone = styled.div`
  position: absolute;
  text-align: center;
  top: 40px;
  left: 60px;
  width: 175px;
  .text {
    z-index: ${v.zIndex.gridCardBg + 1};
    font-family: ${v.fonts.sans};
    font-weight: 500;
    font-size: 1rem;
    position: absolute;
    top: 55px;
    left: 38px;
    .top,
    .bottom {
      text-transform: uppercase;
    }
    .top,
    .or {
      color: ${v.colors.primaryLight};
    }
    .bottom {
      color: ${v.colors.black};
    }
    .or {
      font-size: 0.75rem;
      margin: 6px 0;
    }
    p {
      font-size: 0.8rem;
      color: ${v.colors.commonDark};
    }
    transition: ${v.transitionWithDelay};
  }

  /* Override Filestack styling */
  .fsp-drop-pane__container {
    font-family: ${v.fonts.sans};
    cursor: pointer;
    z-index: ${v.zIndex.gridCardBg + 1};
    border-radius: 50%;
    /* must be transparent -- dropzone is transparent and content behind it is visible */
    background: transparent;
    border: none;
    width: 160px;
    height: 160px;
    ${props =>
      props.droppingFile &&
      `
      background: ${v.colors.primaryLight};
      &::after {
        content: '+';
        font-size: 4rem;
      }
    `};
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
      droppingFile: false,
      bctMenuOpen: false,
      bctMenuOffsetPosition: null,
    }
  }

  componentDidMount() {
    // creating the DropPane via filestack is asynchronous;
    // if the BCT mounts but then immediately gets closed via a uiStore action,
    // we check to not to make the drop pane to prevent it throwing an error
    setTimeout(this.createDropPane, 500)

    if (this.props.preselected === 'text') {
      this.createTextItem()
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

  createDropPane = () => {
    const { replacingId } = this
    const { creating } = this.state
    const { uiStore } = this.props
    if (this.canceled || (creating && creating !== 'file')) return
    const uploadOpts = {}
    if (replacingId) {
      uploadOpts.maxFiles = 1
    }

    // CSS selector where the dropzone will be
    const container = 'dropzone'
    const dropPaneOpts = {
      onProgress: pct => {
        if (this.state.loading) return
        this.setState({ loading: true })
      },
      onDragOver: () => {
        this.setState({ droppingFile: true })
      },
      onDragLeave: () => {
        this.setState({ droppingFile: false })
      },
      onDrop: ev => {
        if (this.state.loading) return
        const { files } = ev.dataTransfer
        const filesThatFit = _.filter(files, f => f.size < MAX_SIZE)
        if (filesThatFit.length) {
          this.setState({ loading: true, droppingFile: false })
        } else {
          this.setState({ loading: false, droppingFile: false })
        }
        if (filesThatFit.length < files.length) {
          uiStore.popupAlert({
            prompt: `
              ${filesThatFit.length} file(s) were successfully added.
              ${files.length -
                filesThatFit.length} file(s) were over 25MB and could not
              be added.
            `,
            fadeOutTime: 6000,
          })
        }
      },
      onSuccess: async res => {
        if (res.length > 0) {
          const files = await FilestackUpload.processFiles(res)
          _.each(files, (file, idx) => {
            this.createCardWith(file, idx)
          })
        }
      },
    }
    FilestackUpload.makeDropPane(container, dropPaneOpts, uploadOpts)
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
        uiStore.update('textEditingItemHasTitleText', false)
        uiStore.update('textEditingItem', card.record)
        uiStore.update('textEditingCardId', card.id)
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
    this.setState({ loading: true }, async () => {
      if (apiStore.currentUser.show_helper) {
        // after creating the card this will get set in the backend
        // so just make it false locally
        runInAction(() => {
          apiStore.currentUser.show_helper = false
        })
      }
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

  createTextItem = item => {
    // prevent multiple clicks (or pressing enter) to create multiple items
    if (this.state.loading) {
      return
    }
    this.setState({ loading: true }, () => {
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
    })
  }

  closeBlankContentTool = () => {
    const { testCollectionCard, preselected, uiStore } = this.props
    if (
      testCollectionCard ||
      (uiStore.blankContentToolState.emptyCollection && !preselected)
    ) {
      this.setState({ creating: null })
      // have to re-create the DropPane
      this.createDropPane()
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
    const { isBoard, isFourWideBoard } = parent
    const { creating, loading, droppingFile } = this.state
    const isReplacing = !!this.replacingId
    const size = v.iconSizes.bct

    switch (creating) {
      case 'collection':
      case 'testCollection':
      case 'template':
      case 'submissionBox':
      case 'foamcoreBoard':
      case 'search':
        inner = (
          <CollectionCreator
            type={creating}
            loading={loading}
            createCard={this.createCard}
            closeBlankContentTool={this.closeBlankContentTool}
            parentIsFourWide={isFourWideBoard}
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
      case 'data':
        inner = (
          <DataItemCreator
            loading={loading}
            createCard={this.createCard}
            closeBlankContentTool={this.closeBlankContentTool}
          />
        )
        break
      default:
        inner = (
          <BctDropzone
            className="bct-dropzone"
            droppingFile={droppingFile}
            id="dropzone"
          >
            {!loading && !droppingFile && (
              <div className="text">
                <img
                  src={bctIcons}
                  alt="dropzone icons"
                  style={{ width: '80px' }}
                />
                <div className="top">Drag &amp; Drop</div>
                <div className="or">or</div>
                <div className="bottom">Browse</div>
              </div>
            )}
          </BctDropzone>
        )
    }

    const testBctBox = (
      <BctButtonBox
        tooltip="Get feedback"
        type="testCollection"
        creating={creating}
        size={size}
        onClick={this.startCreating('testCollection')}
        Icon={() => <TestCollectionIconSm />}
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
        Icon={FoamcoreBoardIcon}
      />
    )
    const collectionBctBox = (
      <BctButtonBox
        tooltip="Create collection"
        type="collection"
        creating={creating}
        size={size}
        onClick={this.startCreating('collection')}
        Icon={AddCollectionIcon}
      />
    )

    return (
      <StyledBlankCreationTool
        board={isBoard}
        replacing={isReplacing && !creating}
      >
        <Flex className="foreground" justify="space-between">
          {/* First row of options */}
          {!isReplacing && !creating && (
            <BctButtonBox
              tooltip="Add text box"
              type="text"
              creating={creating}
              size={size}
              onClick={this.createTextItem}
              Icon={AddTextIcon}
            />
          )}
          {(!creating || creating === 'file') && (
            <BctButtonBox
              tooltip="Add file"
              type="file"
              creating={creating}
              size={size}
              onClick={this.pickImages}
              Icon={AddFileIcon}
            />
          )}
          {(!creating || creating === 'link') && (
            <BctButtonBox
              tooltip="Add URL"
              type="link"
              creating={creating}
              size={size}
              onClick={this.startCreating('link')}
              Icon={AddLinkIcon}
            />
          )}
          {(!creating || creating === 'video') && (
            <BctButtonBox
              tooltip="Link video"
              type="video"
              creating={creating}
              size={size}
              onClick={this.startCreating('video')}
              Icon={AddVideoIcon}
            />
          )}
          {/* These are what to render on state change for second row */}
          {creating === 'collection' && (
            <BctButtonRotation>{collectionBctBox}</BctButtonRotation>
          )}
          {creating === 'foamcoreBoard' && (
            <BctButtonRotation>{foamcoreBoardBctBox}</BctButtonRotation>
          )}
          {creating === 'submissionBox' && (
            <BctButtonRotation>{submissionBctBox}</BctButtonRotation>
          )}
          {creating === 'testCollection' && (
            <BctButtonRotation>{testBctBox}</BctButtonRotation>
          )}
          {creating === 'data' && (
            <BctButtonRotation>
              <BctButtonBox
                type="data"
                creating={creating}
                size={size}
                Icon={() => <ReportIcon size="large" />}
              />
            </BctButtonRotation>
          )}
          {creating === 'template' && (
            <BctButtonRotation>
              <BctButtonBox
                type="template"
                creating={creating}
                size={size}
                Icon={TemplateIcon}
              />
            </BctButtonRotation>
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
                  onClick: this.startCreating('search'),
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
        <BctBackground className="bct-background" />
      </StyledBlankCreationTool>
    )
  }

  render() {
    const { testCollectionCard, uiStore, parent } = this.props
    const { gridSettings, blankContentToolState } = uiStore
    const { creating } = this.state
    const { isBoard } = parent
    let { gridW, gridH } = gridSettings
    if (isBoard) {
      ;({ gridW, gridH } = v.defaultGridSettings)
    }
    const showCloseButton =
      !this.emptyState &&
      (!testCollectionCard || creating || this.replacingTestCollectionMedia)

    return (
      <StyledGridCardBlank boxShadow={isBoard}>
        <StyledGridCardInner
          height={blankContentToolState.height}
          gridW={gridW}
          gridH={gridH}
        >
          {this.renderInner()}
        </StyledGridCardInner>
        {this.state.loading && <InlineLoader />}
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
