import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddCollectionIcon from '~/ui/icons/AddCollectionIcon'
import AddImageIcon from '~/ui/icons/AddImageIcon'
import AddVideoIcon from '~/ui/icons/AddVideoIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
import FilestackUpload from '~/utils/FilestackUpload'
import { StyledGridCard } from '~/ui/grid/GridCard'
import InlineLoader from '~/ui/layout/InlineLoader'
import { CloseButton } from '~/ui/global/styled/buttons'
import bctIcons from '~/assets/bct_icons.png'

import CollectionCreator from './CollectionCreator'
import TextItemCreator from './TextItemCreator'
import VideoCreator from './VideoCreator'

const StyledGridCardBlank = StyledGridCard.extend`
  background: ${props => (props.emptyState ? 'transparent' : 'white')};
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
  .foreground {
    position: relative;
    z-index: ${v.zIndex.gridCard};
    left: ${props => (props.replacing ? '25%' : 'auto')};
    width: ${props => (props.replacing ? '50%' : 'auto')};
  }
  transition: ${v.transitionWithDelay};
  /* handle "small 4-col" layout i.e. layoutSize == 3 */
  @media only screen
    and (min-width: ${v.responsive.medBreakpoint}px)
    and (max-width: ${v.responsive.largeBreakpoint}px) {
    padding: 1.5rem 1.33rem;
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
  background: ${props => (props.emptyState ? v.colors.aquaHaze : v.colors.desert)};
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

const BctButton = styled.button`
  position: relative;
  width: 47px;
  height: 47px;
  border-radius: 50%;
  background: ${v.colors.blackLava};
  color: white;

  left: ${props => (props.creating ? '100px' : 0)};
  @media only screen
    and (min-width: ${v.responsive.medBreakpoint}px)
    and (max-width: ${v.responsive.largeBreakpoint}px) {
    left: ${props => (props.creating ? '80px' : 0)};
  }
  transform: ${props => (props.creating ? 'rotate(360deg)' : 'none')};

  &:hover {
    background-color: ${v.colors.cloudy};
  }

  .icon {
    position: absolute;
    left: 0;
    top: 0;
    width: 47px;
    height: 47px;
  }
`
BctButton.displayName = 'BctButton'

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
    top: 70px;
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
      top: 50px;
      left: 25px;
      font-size: 0.9rem;
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
  state = {
    creating: null,
    loading: false,
    droppingFile: false,
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
    if (this.canceled) return
    FilestackUpload.makeDropPane({
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
      onDrop: () => {
        if (this.state.loading) return
        this.setState({ loading: true, droppingFile: false })
      },
      onSuccess: (res) => {
        if (res.length > 0) {
          const img = res[0]
          img.url = FilestackUpload.transformedUrl(img.url)
          this.createCardWith(img)
        }
      }
    })
  }

  get emptyState() {
    const { uiStore } = this.props
    return uiStore.blankContentToolState.emptyCollection && !this.state.creating
  }

  startCreatingCollection = () => {
    this.setState({ creating: 'collection' })
  }

  startCreatingText = () => {
    this.setState({ creating: 'text' })
  }

  startCreatingVideo = () => {
    this.setState({ creating: 'video' })
  }

  createCardWith = (img) => {
    const attrs = {
      item_attributes: {
        type: ITEM_TYPES.IMAGE,
        filestack_file_attributes: {
          url: img.url,
          handle: img.handle,
          filename: img.filename,
          size: img.size,
          mimetype: img.mimetype,
        },
      },
    }
    this.createCard(attrs)
  }

  pickImage = () => {
    FilestackUpload.pickImage({
      onSuccess: (img) => this.createCardWith(img)
    })
  }

  createCard = (nested = {}) => {
    const { parent, apiStore, uiStore } = this.props
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
      await card.API_create({ isReplacing })
      if (isReplacing) {
        const cardToReplace = apiStore.find('collection_cards', replacingId)
        await cardToReplace.API_archive({ isReplacing })
      }
      // NOTE: closeBlankContentTool() will automatically get called
      // in CollectionCard after the async actions are complete
    })
  }

  closeBlankContentTool = () => {
    const { uiStore } = this.props
    if (uiStore.blankContentToolState.emptyCollection) {
      this.setState({ creating: null })
      // have to re-create the DropPane
      this.createDropPane()
    } else {
      this.props.uiStore.closeBlankContentTool()
    }
  }

  renderInner = () => {
    let inner
    switch (this.state.creating) {
    case 'collection':
      inner = (
        <CollectionCreator
          loading={this.state.loading}
          createCard={this.createCard}
          closeBlankContentTool={this.closeBlankContentTool}
        />
      )
      break
    case 'video':
      inner = (
        <VideoCreator
          loading={this.state.loading}
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
          loading={this.state.loading}
          height={this.props.height}
          createCard={this.createCard}
          closeBlankContentTool={this.closeBlankContentTool}
        />
      )
    default:
      inner = (
        <BctDropzone droppingFile={this.state.droppingFile} id="dropzone">
          {!this.state.loading && !this.state.droppingFile &&
            <div className="text">
              <img src={bctIcons} alt="Vimeo, picture, youtube icons"
                style={{ width: '80px' }} />
              <div className="top">Drag &amp; Drop</div>
              <div className="or">or</div>
              <div className="bottom">Browse</div>
            </div>
          }
        </BctDropzone>
      )
    }

    const isReplacing = !!this.props.uiStore.blankContentToolState.replacingId
    const { creating } = this.state

    const size = v.iconSizes.bct
    return (
      <StyledBlankCreationTool replacing={isReplacing && !creating}>
        <Flex className="foreground" align="center" justify="space-between">
          {(!isReplacing && (!creating || creating === 'collection')) &&
            <Box>
              <BctButton
                creating={creating === 'collection'}
                onClick={this.startCreatingCollection}
              >
                <AddCollectionIcon width={size} height={size} color="white" />
              </BctButton>
            </Box>
          }
          {!creating &&
            <Box>
              <BctButton onClick={this.pickImage}>
                <AddImageIcon width={size} height={size} color="white" />
              </BctButton>
            </Box>
          }
          {(!creating || creating === 'video') &&
            <Box>
              <BctButton
                creating={creating === 'video'}
                onClick={this.startCreatingVideo}
              >
                <AddVideoIcon width={size} height={size} color="white" />
              </BctButton>
            </Box>
          }
          {(!isReplacing && !creating) &&
            <Box>
              <BctButton onClick={this.startCreatingText}>
                <AddTextIcon width={size} height={size} color="white" />
              </BctButton>
            </Box>
          }
        </Flex>
        {inner}
        <BctBackground emptyState={this.emptyState} />
      </StyledBlankCreationTool>
    )
  }

  render() {
    const { uiStore } = this.props
    const { gridSettings, blankContentToolState } = uiStore
    return (
      <StyledGridCardBlank emptyState={this.emptyState}>
        <StyledGridCardInner
          height={blankContentToolState.height}
          gridW={gridSettings.gridW}
          gridH={gridSettings.gridH}
        >
          {this.renderInner()}
        </StyledGridCardInner>
        { this.state.loading && <InlineLoader /> }
        { !this.emptyState &&
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
}
GridCardBlank.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

// give a name to the injected component for unit tests
GridCardBlank.displayName = 'GridCardBlankHOC'

export default GridCardBlank
