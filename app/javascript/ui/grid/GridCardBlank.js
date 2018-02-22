import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddCollectionIcon from '~/ui/icons/AddCollectionIcon'
import AddImageIcon from '~/ui/icons/AddImageIcon'
import v from '~/utils/variables'
import FilestackUpload from '~/utils/filestack_upload'
import { StyledGridCard } from './GridCard'

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
  padding: 2rem;

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
const BctButton = styled.button`
  position: relative;
  width: 47px;
  height: 47px;
  border-radius: 50%;
  background: ${v.colors.dark};
  color: white;

  &:hover {
    background-color: #676767;
  }

  svg {
    position: absolute;
    left: 0;
    top: 0;
  }
`

const BctBackground = styled.div`
  z-index: 1;
  position: absolute;
  top: 40px;
  left: 60px;
  width: 175px;
  height: 175px;
  border-radius: 50%;
  border: 8px solid ${v.colors.cyan};
  background: ${v.colors.cyanLight};
`

@inject('uiStore', 'apiStore')
@observer
class GridCardBlank extends React.Component {
  state = {
    creatingCollection: false,
    creatingText: false,
    loading: false,
    inputText: '',
  }

  onTextChange = (e) => {
    this.setState({
      inputText: e.target.value
    })
  }

  startCreatingCollection = () => {
    this.setState({ creatingCollection: true })
  }

  startCreatingText = () => {
    this.setState({ creatingText: true })
  }

  createCard = (nested = {}) => {
    const attrs = {
      // NOTE: technically this uses the same order as the card it is going "next to"
      // but will be given order + 1 after reorderCards()
      order: this.props.order,
      width: 1,
      height: 1,
      // `parent` is the collection this card belgngs to
      parent_id: this.props.parent.id,
    }
    // apply nested attrs
    Object.assign(attrs, nested)
    const card = new CollectionCard(attrs, this.props.apiStore)
    this.setState({ loading: true }, () => {
      card.API_create().then(() => {
        // this will close the blank card so no need to set loading: false
        this.closeBlankContentTool()
      })
    })
  }

  pickImage = () => {
    FilestackUpload
      .pickImage()
      .then(resp => {
        if (resp.filesUploaded.length > 0) {
          const img = resp.filesUploaded[0]
          const attrs = {
            item_attributes: {
              type: 'Item::ImageItem',
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

  createCollection = () => {
    this.createCard({
      // `collection` is the collection being created within the card
      collection_attributes: {
        name: this.state.inputText,
      }
    })
  }

  createTextItem = () => {
    this.createCard({
      item_attributes: {
        // name will get created in Rails
        content: this.state.inputText,
        // store all of these types somewhere centrally?
        type: 'Item::TextItem',
      }
    })
  }

  closeBlankContentTool = () => {
    this.props.uiStore.closeBlankContentTool()
  }

  renderInner = () => {
    if (this.state.creatingCollection) {
      return (
        <div>
          <input
            placeholder="Collection name"
            value={this.state.inputText}
            onChange={this.onTextChange}
          />
          <input
            onClick={this.createCollection}
            type="submit"
            value="save"
            disabled={this.state.loading}
          />
        </div>
      )
    } else if (this.state.creatingText) {
      return (
        <div>
          <textarea
            rows="8"
            cols="28"
            placeholder="Add your text"
            onChange={this.onTextChange}
            value={this.state.inputText}
          />
          <input
            onClick={this.createTextItem}
            type="submit"
            value="save"
            disabled={this.state.loading}
          />
        </div>
      )
    }
    const iconSize = 47
    return (
      <div>
        <Flex style={{ position: 'relative', zIndex: 2 }} align="center" justify="space-between">
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
            <BctButton onClick={this.startCreatingText}>
              <AddTextIcon width={iconSize} height={iconSize} color="white" />
            </BctButton>
          </Box>
          <Box>
            <BctButton onClick={this.startCreatingText}>
              <AddTextIcon width={iconSize} height={iconSize} color="white" />
            </BctButton>
          </Box>
        </Flex>
        <BctBackground />
      </div>
    )
  }

  render() {
    return (
      <StyledGridCardBlank>
        <StyledGridCardInner>
          {this.renderInner()}
          <br />
          <br />
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
}
GridCardBlank.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardBlank.displayName = 'GridCardBlankHOC'

export default GridCardBlank
