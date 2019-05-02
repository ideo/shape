import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex } from 'reflexbox'

import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddCollectionIcon from '~/ui/icons/AddCollectionIcon'
import AddFileIcon from '~/ui/icons/AddFileIcon'
import AddVideoIcon from '~/ui/icons/AddVideoIcon'
import AddLinkIcon from '~/ui/icons/AddLinkIcon'
import ReportIcon from '~/ui/icons/ReportIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import SubmissionBoxIcon from '~/ui/icons/SubmissionBoxIcon'
import FoamcoreBoardIcon from '~/ui/icons/FoamcoreBoardIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
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

const StyledGridCardBlank = StyledGridCard.extend`
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
  transition: ${v.transitionWithDelay};

  /* handle "small 4-col" layout i.e. layoutSize == 3, except on Foamcore */
  ${props =>
    !props.board &&
    `
      @media only screen and (min-width: ${
        v.responsive.medBreakpoint
      }px) and (max-width: ${v.responsive.largeBreakpoint}px) {
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
    }
  }

  componentDidMount() {
    // creating the DropPane via filestack is asynchronous;
    // if the BCT mounts but then immediately gets closed via a uiStore action,
    // we check to not to make the drop pane to prevent it throwing an error
    setTimeout(this.createDropPane, 500)
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
    const dropPaneOpts = {
      id: 'dropzone',
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
          files.forEach(file => this.createCardWith(file))
        }
      },
    }
    FilestackUpload.makeDropPane(dropPaneOpts, uploadOpts)
  }

  get emptyState() {
    const { uiStore } = this.props
    return uiStore.blankContentToolState.emptyCollection && !this.state.creating
  }

  startCreating = type => () => {
    this.setState({ creating: type, bctMenuOpen: false })
  }

  createCardWith = file => {
    const attrs = {
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
    this.createCard(attrs)
  }

  createDefaultReportCard = () => {
    this.createCard({
      item_attributes: {
        type: ITEM_TYPES.DATA,
        name: 'Report',
        report_type: 'report_type_collections_and_items',
        data_settings: {
          d_measure: 'participants',
          d_timeframe: 'ever',
        },
      },
    })
  }

  pickImages = () => {
    const { replacingId } = this
    const filestackMethod = !replacingId
      ? FilestackUpload.pickImages
      : FilestackUpload.pickImage
    filestackMethod({
      onSuccess: files =>
        !replacingId
          ? files.forEach(file => this.createCardWith(file))
          : this.createCardWith(files),
    })
  }

  createCard = (nested = {}, options = {}) => {
    const { replacingId } = this
    const { afterCreate, parent, apiStore, uiStore } = this.props
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
      image_contain: this.props.defaultShowWholeImage,
    }
    // apply nested attrs
    Object.assign(attrs, nested)
    const card = new CollectionCard(attrs, apiStore)
    card.parent = parent // Assign parent so store can get access to it
    this.setState({ loading: true }, async () => {
      let newCard
      if (isReplacing) {
        newCard = await card.API_replace({ replacingId })
      } else {
        newCard = await card.API_create()
      }
      uiStore.addNewCard(newCard.record.id)
      // afterCreate can come passed down from props
      if (afterCreate) afterCreate(newCard)
      // or separately from the createCard action (e.g. CollectionCreator)
      if (options.afterCreate) options.afterCreate(newCard)
      // NOTE: closeBlankContentTool() will automatically get called
      // in CollectionCard after the async actions are complete
    })
  }

  createTextItem = item => {
    this.createCard(
      {
        item_attributes: {
          name: 'Text',
          content: '',
          data_content: { ops: [] },
          type: ITEM_TYPES.TEXT,
        },
      },
      {
        afterCreate: card => {
          this.props.uiStore.update('textEditingItem', card.record)
        },
      }
    )
  }

  closeBlankContentTool = () => {
    const { uiStore } = this.props
    if (
      uiStore.blankContentToolState.emptyCollection &&
      !this.props.preselected
    ) {
      this.setState({ creating: null })
      // have to re-create the DropPane
      this.createDropPane()
    } else {
      this.props.uiStore.closeBlankContentTool()
    }
  }

  toggleBctMenu = () => {
    this.setState(({ bctMenuOpen }) => ({ bctMenuOpen: !bctMenuOpen }))
  }

  renderInner = () => {
    let inner
    const { creating, loading, droppingFile } = this.state
    const { isBoard } = this.props.parent
    const isReplacing = !!this.replacingId
    const size = v.iconSizes.bct

    switch (creating) {
      case 'collection':
      case 'testCollection':
      case 'template':
      case 'submissionBox':
      case 'foamcoreBoard':
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
            {!loading &&
              !droppingFile && (
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
        Icon={() => <TestCollectionIcon size="small" />}
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
          {!isReplacing &&
            !creating && (
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
        {!isReplacing &&
          !creating && (
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
                    name: 'Create Report',
                    iconLeft: <ReportIcon />,
                    onClick: this.createDefaultReportCard,
                  },
                ]}
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
    const { isBoard } = parent
    let { gridW, gridH } = gridSettings
    if (isBoard) {
      ;({ gridW, gridH } = uiStore.defaultGridSettings)
    }
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
        {!this.emptyState &&
          !testCollectionCard && (
            <CloseButton onClick={this.closeBlankContentTool} />
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
  testCollectionCard: PropTypes.bool,
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
  testCollectionCard: false,
  defaultShowWholeImage: false,
}

// give a name to the injected component for unit tests
GridCardBlank.displayName = 'GridCardBlank'

export default GridCardBlank
