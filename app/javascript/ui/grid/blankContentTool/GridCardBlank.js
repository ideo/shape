import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex } from 'reflexbox'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddCollectionIcon from '~/ui/icons/AddCollectionIcon'
import AddFileIcon from '~/ui/icons/AddFileIcon'
import AddVideoIcon from '~/ui/icons/AddVideoIcon'
import AddLinkIcon from '~/ui/icons/AddLinkIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import SubmissionBoxIcon from '~/ui/icons/SubmissionBoxIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
import FilestackUpload, { MAX_SIZE } from '~/utils/FilestackUpload'
import { StyledGridCard } from '~/ui/grid/shared'
import InlineLoader from '~/ui/layout/InlineLoader'
import { CloseButton } from '~/ui/global/styled/buttons'
import bctIcons from '~/assets/bct_icons.png'
import PopoutMenu from '~/ui/global/PopoutMenu'

import CollectionCreator from './CollectionCreator'
import TextItemCreator from './TextItemCreator'
import VideoCreator from './VideoCreator'
import LinkCreator from './LinkCreator'
import BctButtonBox from './BctButtonBox'
import BctButtonRotation from './BctButtonRotation'

const StyledGridCardBlank = StyledGridCard.extend`
  background: transparent;
  cursor: auto;
  position: relative;
  button {
    cursor: pointer;
    border: none;
    transition: all 300ms;
  }
`

// width of card is constrained by gridW
// vertical position is adjusted by gridH / 2 if card is 2 rows tall
const StyledGridCardInner = styled.div`
  max-width: ${props => props.gridW}px;
  margin: 0 auto;
  position: relative;
  top: ${props => (props.height > 1 ? (props.gridH / 2) : 0)}px;
`
const StyledBlankCreationTool = styled.div`
  padding: 2rem;
  position: relative;
  .foreground {
    position: relative;
    z-index: ${v.zIndex.gridCard};
    left: ${props => (props.replacing ? '25%' : 'auto')};
    width: ${props => (props.replacing ? '50%' : '100%')};
    &.foreground-bottom {
      top: 120px;
      margin: 0 auto;
    }
  }
  transition: ${v.transitionWithDelay};
  /* handle "small 4-col" layout i.e. layoutSize == 3 */
  @media only screen
    and (min-width: ${v.responsive.medBreakpoint}px)
    and (max-width: ${v.responsive.largeBreakpoint}px) {
    padding: 1.5rem 1.33rem;

    .foreground.foreground-bottom {
      top: 80px;
    }
  }
`

const BctBackground = styled.div`
  z-index: ${v.zIndex.gridCardBg};
  position: absolute;
  top: 40px;
  left: 60px;
  width: 175px;
  height: 175px;
  border-radius: 50%;
  border: 8px solid ${v.colors.cyan};
  background: ${v.colors.aquaHaze};
  transition: ${v.transitionWithDelay};

  /* handle "small 4-col" layout i.e. layoutSize == 3 */
  @media only screen
    and (min-width: ${v.responsive.medBreakpoint}px)
    and (max-width: ${v.responsive.largeBreakpoint}px) {
    width: 135px;
    height: 135px;
    left: 50px;
  }
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
    .top, .bottom {
      text-transform: uppercase;
    }
    .top, .or {
      color: ${v.colors.cyan};
    }
    .bottom {
      color: ${v.colors.blackLava};
    }
    .or {
      font-size: 0.75rem;
      margin: 6px 0;
    }
    p {
      font-size: 0.8rem;
      color: ${v.colors.cloudy};
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
    ${props => props.droppingFile && `
      background: ${v.colors.cyan};
      &::after {
        content: '+';
        font-size: 4rem;
      }
    `}
  }

  /* handle "small 4-col" layout i.e. layoutSize == 3 */
  @media only screen
    and (min-width: ${v.responsive.medBreakpoint}px)
    and (max-width: ${v.responsive.largeBreakpoint}px) {
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

  createDropPane = () => {
    const { creating } = this.state
    const { uiStore } = this.props
    const { replacingId } = uiStore.blankContentToolState
    if (this.canceled || (creating && creating !== 'file')) return
    const uploadOpts = {}
    if (replacingId) {
      uploadOpts.maxFiles = 1
    }
    const dropPaneOpts = {
      id: 'dropzone',
      onProgress: (pct) => {
        if (this.state.loading) return
        this.setState({ loading: true })
      },
      onDragOver: () => {
        this.setState({ droppingFile: true })
      },
      onDragLeave: () => {
        this.setState({ droppingFile: false })
      },
      onDrop: (ev) => {
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
              ${files.length - filesThatFit.length} file(s) were over 25MB and could not
              be added.
            `,
            fadeOutTime: 6000,
          })
        }
      },
      onSuccess: async (res) => {
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

  createCardWith = (file) => {
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

  pickImages = () => {
    const { uiStore } = this.props
    const { replacingId } = uiStore.blankContentToolState
    const filestackMethod = !replacingId ? FilestackUpload.pickImages
      : FilestackUpload.pickImage
    filestackMethod({
      onSuccess: (files) => (
        !replacingId ? files.forEach(file => this.createCardWith(file))
          : this.createCardWith(files))
    })
  }

  createCard = (nested = {}, options = {}) => {
    const { afterCreate, parent, apiStore, uiStore } = this.props
    const { order, width, height, replacingId } = uiStore.blankContentToolState
    const isReplacing = !!replacingId
    const attrs = {
      order,
      width,
      height,
      // `parent` is the collection this card belongs to
      parent_id: parent.id,
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
      // afterCreate can come passed down from props
      if (afterCreate) afterCreate(newCard)
      // or separately from the createCard action (e.g. CollectionCreator)
      if (options.afterCreate) options.afterCreate(newCard)
      // NOTE: closeBlankContentTool() will automatically get called
      // in CollectionCard after the async actions are complete
    })
  }

  closeBlankContentTool = () => {
    const { uiStore } = this.props
    if (uiStore.blankContentToolState.emptyCollection &&
        !this.props.preselected) {
      this.setState({ creating: null })
      // have to re-create the DropPane
      this.createDropPane()
    } else {
      this.props.uiStore.closeBlankContentTool()
    }
  }

  toggleBctMenu = () => {
    this.setState(({ bctMenuOpen }) => (
      { bctMenuOpen: !bctMenuOpen }
    ))
  }

  renderInner = () => {
    let inner
    const { creating, loading, droppingFile } = this.state
    const isReplacing = !!this.props.uiStore.blankContentToolState.replacingId
    const size = v.iconSizes.bct

    switch (creating) {
    case 'collection':
    case 'testCollection':
    case 'template':
    case 'submissionBox':
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
        <VideoCreator
          loading={loading}
          createCard={this.createCard}
          closeBlankContentTool={this.closeBlankContentTool}
        />
      )
      break
    case 'link':
      inner = (
        <LinkCreator
          loading={loading}
          createCard={this.createCard}
          closeBlankContentTool={this.closeBlankContentTool}
        />
      )
      break
    case 'text':
      // TextItemCreator is the only one that `returns`
      // since it doesn't use the BctBackground
      return (
        <TextItemCreator
          loading={loading}
          height={this.props.height}
          createCard={this.createCard}
          closeBlankContentTool={this.closeBlankContentTool}
        />
      )
    default:
      inner = (
        <BctDropzone droppingFile={droppingFile} id="dropzone">
          {!loading && !droppingFile &&
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
          }
        </BctDropzone>
      )
    }

    const videoBctBox = (
      <BctButtonBox
        tooltip="Link video"
        type="video"
        creating={creating}
        size={size}
        onClick={this.startCreating('video')}
        Icon={AddVideoIcon}
      />
    )
    const testBctBox = (
      <BctButtonBox
        tooltip="Create test"
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

    return (
      <StyledBlankCreationTool replacing={isReplacing && !creating}>
        <Flex className="foreground" justify="space-between">
          {(!isReplacing && (!creating || creating === 'collection')) &&
            <BctButtonBox
              tooltip="Create collection"
              type="collection"
              creating={creating}
              size={size}
              onClick={this.startCreating('collection')}
              Icon={AddCollectionIcon}
            />
          }
          {(!isReplacing && !creating) &&
            <BctButtonBox
              tooltip="Add text box"
              type="text"
              creating={creating}
              size={size}
              onClick={this.startCreating('text')}
              Icon={AddTextIcon}
            />
          }
          {(!creating || creating === 'file') &&
            <BctButtonBox
              tooltip="Add file"
              type="file"
              creating={creating}
              size={size}
              onClick={this.pickImages}
              Icon={AddFileIcon}
            />
          }
          {(!isReplacing && (!creating || creating === 'link')) &&
            <BctButtonBox
              tooltip="Add URL"
              type="link"
              creating={creating}
              size={size}
              onClick={this.startCreating('link')}
              Icon={AddLinkIcon}
            />
          }
          {(isReplacing || creating === 'video') &&
            <BctButtonRotation disabled={isReplacing}>
              {videoBctBox}
            </BctButtonRotation>
          }
          {creating === 'testCollection' &&
            <BctButtonRotation>
              {testBctBox}
            </BctButtonRotation>
          }
          {creating === 'submissionBox' &&
            <BctButtonRotation>
              {submissionBctBox}
            </BctButtonRotation>
          }
          {creating === 'template' &&
            <BctButtonRotation>
              <BctButtonBox
                type="template"
                creating={creating}
                size={size}
                Icon={TemplateIcon}
              />
            </BctButtonRotation>
          }
        </Flex>

        {(!isReplacing && !creating) &&
          <Flex
            className="foreground foreground-bottom"
            justify="space-between"
          >
            {videoBctBox}
            {submissionBctBox}
            {testBctBox}
            <PopoutMenu
              buttonStyle="bct"
              menuOpen={this.state.bctMenuOpen}
              onClick={this.toggleBctMenu}
              direction="right"
              menuItems={[
                { name: 'Create Template', iconRight: <TemplateIcon size="small" />, onClick: this.startCreating('template') }
              ]}
            />
          </Flex>
        }
        {inner}
        <BctBackground />
      </StyledBlankCreationTool>
    )
  }

  render() {
    const { uiStore } = this.props
    const { gridSettings, blankContentToolState } = uiStore
    const { creating } = this.state
    return (
      <StyledGridCardBlank>
        <StyledGridCardInner
          height={blankContentToolState.height}
          gridW={gridSettings.gridW}
          gridH={gridSettings.gridH}
        >
          {this.renderInner()}
        </StyledGridCardInner>
        { this.state.loading && <InlineLoader /> }
        { !this.emptyState && creating !== 'text' &&
          <CloseButton onClick={this.closeBlankContentTool} />
        }
      </StyledGridCardBlank>
    )
  }
}

GridCardBlank.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  height: PropTypes.number.isRequired,
  afterCreate: PropTypes.func,
  preselected: PropTypes.string,
}
GridCardBlank.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
GridCardBlank.defaultProps = {
  afterCreate: null,
  preselected: null,
}

// give a name to the injected component for unit tests
GridCardBlank.displayName = 'GridCardBlankHOC'

export default GridCardBlank
