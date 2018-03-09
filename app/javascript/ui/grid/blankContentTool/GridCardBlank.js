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

import CollectionCreator from './CollectionCreator'
import TextItemCreator from './TextItemCreator'
import VideoCreator from './VideoCreator'

const zIndex = {
  foreground: 2,
  background: 1,
}

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
    color: #9b9b9b;
    font-size: 1.75rem;
    top: 0rem;
    right: 0.33rem;

    &:hover {
      color: black;
    }
  }
`
const StyledBlankCreationTool = styled.div`
  padding: 2rem;
  .foreground {
    position: relative;
    z-index: ${zIndex.foreground};
  }
`

const BctButton = styled.button`
  position: relative;
  width: 47px;
  height: 47px;
  border-radius: 50%;
  background: ${v.colors.blackLava};
  color: white;

  &:hover {
    background-color: ${v.colors.gray};
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

const BctBackground = styled.div`
  z-index: ${zIndex.background};
  position: absolute;
  top: 40px;
  left: 60px;
  width: 175px;
  height: 175px;
  border-radius: 50%;
  border: 8px solid ${v.colors.cyan};
  background: ${v.colors.desert};
`

@inject('uiStore', 'apiStore')
@observer
class GridCardBlank extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      creating: null,
      loading: false,
    }
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

  pickImage = () => {
    FilestackUpload
      .pickImage()
      .then(resp => {
        if (resp.filesUploaded.length > 0) {
          const img = resp.filesUploaded[0]
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
    switch (this.state.creating) {
    case 'collection':
      return (
        <CollectionCreator
          loading={this.state.loading}
          createCard={this.createCard}
        />
      )
    case 'video':
      return (
        <VideoCreator
          loading={this.state.loading}
          createCard={this.createCard}
        />
      )
    case 'text':
      return (
        <TextItemCreator
          height={this.props.height}
          createCard={this.createCard}
          closeBlankContentTool={this.closeBlankContentTool}
        />
      )
    default:
      break
    }

    const iconSize = 47
    return (
      <StyledBlankCreationTool>
        <Flex className="foreground" align="center" justify="space-between">
          <Box>
            <BctButton onClick={this.startCreatingCollection}>
              <AddCollectionIcon width={iconSize} height={iconSize} color="white" />
            </BctButton>
          </Box>
          <Box>
            <BctButton onClick={this.pickImage}>
              <AddImageIcon width={iconSize} height={iconSize} color="white" />
            </BctButton>
          </Box>
          <Box>
            <BctButton onClick={this.startCreatingVideo}>
              <AddVideoIcon width={iconSize} height={iconSize} color="white" />
            </BctButton>
          </Box>
          <Box>
            <BctButton onClick={this.startCreatingText}>
              <AddTextIcon width={iconSize} height={iconSize} color="white" />
            </BctButton>
          </Box>
        </Flex>
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
            &times;
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
}
GridCardBlank.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

// give a name to the injected component for unit tests
GridCardBlank.displayName = 'GridCardBlankHOC'

export default GridCardBlank
