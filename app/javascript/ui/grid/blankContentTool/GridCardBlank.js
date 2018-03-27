import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddCollectionIcon from '~/ui/icons/AddCollectionIcon'
import AddImageIcon from '~/ui/icons/AddImageIcon'
import AddVideoIcon from '~/ui/icons/AddVideoIcon'
import CloseIcon from '~/ui/icons/CloseIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
import FilestackUpload from '~/utils/FilestackUpload'
import { StyledGridCard } from '~/ui/grid/GridCard'

import CollectionCreator from './CollectionCreator'
import TextItemCreator from './TextItemCreator'
import VideoCreator from './VideoCreator'

const StyledGridCardBlank = StyledGridCard.extend`
  background: white;
  cursor: auto;
  position: relative;

  button {
    cursor: pointer;
    border: none;
    transition: all 300ms;
  }
`

const StyledGridCardInner = styled.div`
  button.close {
    position: absolute;
    top: 5px;
    right: 10px;
    color: #9b9b9b;
    .icon {
      width: 12px;
      height: 12px;
    }

    &:hover {
      color: black;
    }
  }
`
const StyledBlankCreationTool = styled.div`
  padding: 2rem;
  .foreground {
    position: relative;
    z-index: ${v.zIndex.gridCard};
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
  background: ${v.colors.desert};
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
  left: 56px;
  width: 175px;
  .text {
    z-index: ${v.zIndex.gridCardBg + 1};
    font-family: ${v.fonts.sans};
    font-weight: 500;
    font-size: 1rem;
    position: absolute;
    top: 80px;
    left: 40px;
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
  }

  /* Override Filestack styling */
  .fsp-drop-pane__container {
    cursor: pointer;
    z-index: ${v.zIndex.gridCardBg + 1};
    border-radius: 50%;
    background: transparent;
    border: none;
    width: 165px;
    height: 160px;
  }
`

@inject('uiStore', 'apiStore')
@observer
class GridCardBlank extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      creating: props.creating,
      loading: false,
    }
  }

  componentDidMount() {
    FilestackUpload.makeDropPane({
      id: 'dropzone',
      onProgress: (pct) => {
        if (this.state.loading) return
        this.setState({ loading: true })
      },
      onDrop: () => {
        if (this.state.loading) return
        this.setState({ loading: true })
      },
      onSuccess: (res) => {
        if (res.length > 0) {
          this.createCardWith(res[0])
        }
      }
    })
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
    FilestackUpload
      .pickImage()
      .then(resp => {
        if (resp.filesUploaded.length > 0) {
          const img = resp.filesUploaded[0]
          this.createCardWith(img)
        } else {
          // console.log('Failed to upload image:', resp.filesFailed)
        }
      })
  }

  createCard = (nested = {}) => {
    const attrs = {
      order: this.props.order + 1,
      width: 1,
      height: 1,
      // `parent` is the collection this card belongs to
      parent_id: this.props.parent.id,
    }
    // apply nested attrs
    Object.assign(attrs, nested)
    const card = new CollectionCard(attrs, this.props.apiStore)
    card.parent = this.props.parent // Assign parent so store can get access to it
    this.setState({ loading: true }, () => {
      card.API_create()
        .then(() => {
          // this will close the blank card so no need to set loading: false
          this.closeBlankContentTool()
        })
    })
  }

  closeBlankContentTool = () => {
    this.props.uiStore.closeBlankContentTool()
  }

  renderInner = () => {
    let inner
    switch (this.state.creating) {
    case 'collection':
      inner = (
        <CollectionCreator
          loading={this.state.loading}
          createCard={this.createCard}
        />
      )
      break
    case 'video':
      inner = (
        <VideoCreator
          loading={this.state.loading}
          createCard={this.createCard}
        />
      )
      break
    case 'text':
      // TextItemCreator is the only one that `returns`
      // since it doesn't use the BctBackground
      return (
        <TextItemCreator
          height={this.props.height}
          createCard={this.createCard}
          closeBlankContentTool={this.closeBlankContentTool}
        />
      )
    default:
      inner = (
        <BctDropzone id="dropzone">
          {!this.state.loading &&
            <div className="text">
              <div className="top">Drag &amp; Drop</div>
              <div className="or">or</div>
              <div className="bottom">Browse</div>
            </div>
          }
        </BctDropzone>
      )
    }

    const size = v.iconSizes.bct
    return (
      <StyledBlankCreationTool>
        <Flex className="foreground" align="center" justify="space-between">
          {(!this.state.creating || this.state.creating === 'collection') &&
            <Box>
              <BctButton
                creating={this.state.creating === 'collection'}
                onClick={this.startCreatingCollection}
              >
                <AddCollectionIcon width={size} height={size} color="white" />
              </BctButton>
            </Box>
          }
          {(!this.state.creating) &&
            <Box>
              <BctButton onClick={this.pickImage}>
                <AddImageIcon width={size} height={size} color="white" />
              </BctButton>
            </Box>
          }
          {(!this.state.creating || this.state.creating === 'video') &&
            <Box>
              <BctButton
                creating={this.state.creating === 'video'}
                onClick={this.startCreatingVideo}
              >
                <AddVideoIcon width={size} height={size} color="white" />
              </BctButton>
            </Box>
          }
          {(!this.state.creating) &&
            <Box>
              <BctButton onClick={this.startCreatingText}>
                <AddTextIcon width={size} height={size} color="white" />
              </BctButton>
            </Box>
          }
        </Flex>
        {inner}
        <BctBackground />
      </StyledBlankCreationTool>
    )
  }

  render() {
    return (
      <StyledGridCardBlank>
        <StyledGridCardInner>
          {this.renderInner()}
          <button className="close" onClick={this.closeBlankContentTool}>
            <CloseIcon />
          </button>
        </StyledGridCardInner>
      </StyledGridCardBlank>
    )
  }
}

GridCardBlank.propTypes = {
  order: PropTypes.number.isRequired,
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  height: PropTypes.number.isRequired,
  creating: PropTypes.string,
}
GridCardBlank.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
GridCardBlank.defaultProps = {
  creating: null,
}

// give a name to the injected component for unit tests
GridCardBlank.displayName = 'GridCardBlankHOC'

export default GridCardBlank
