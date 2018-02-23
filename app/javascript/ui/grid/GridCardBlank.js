import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import Icon from '~/ui/global/Icon'
import FilestackUpload from '~/utils/FilestackUpload'
import VideoUrl from '~/utils/VideoUrl'
import { StyledGridCard } from './GridCard'

const StyledGridCardBlank = StyledGridCard.extend`
  background: white;
  cursor: auto;

  button {
    cursor: pointer;
    border: none;
  }
`

const StyledGridCardInner = styled.div`
  padding: 2rem;
`

@inject('uiStore', 'apiStore')
@observer
class GridCardBlank extends React.Component {
  state = {
    creatingCollection: false,
    showVideoItemForm: false,
    loading: false,
    inputText: '',
    videoUrl: ''
  }

  onTextChange = (e) => {
    this.setState({
      inputText: e.target.value
    })
  }

  onVideoUrlChange = (e) => {
    this.setState({
      videoUrl: e.target.value
    })
  }

  newCardAttrs = (customAttrs) => (
    _.merge({
      // NOTE: technically this uses the same order as the card it is going "next to"
      // but will be given order + 1 after reorderCards()
      order: this.props.order,
      width: 1,
      height: 1,
      // `parent` is the collection this card belgngs to
      parent_id: this.props.parent.id,
    }, customAttrs)
  )

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
          //console.log('Failed to upload image:', resp.filesFailed)
        }
      })
  }

  videoUrlIsValid = () => (
    VideoUrl.isValid(this.state.videoUrl)
  )

  createVideoItem = () => {
    if (this.videoUrlIsValid()) {
      // Get a normalized URL to make it easier to handle in our system
      const { normalizedUrl } = VideoUrl.parse(this.state.videoUrl)
      const attrs = {
        item_attributes: {
          type: 'Item::VideoItem',
          url: normalizedUrl
        },
      }
      this.createCard(attrs)
    } else {
      console.log('invalid url')
    }
  }

  createCard = (customAttrs = {}) => {
    const card = new CollectionCard(
      this.newCardAttrs(customAttrs),
      this.props.apiStore
    )

    this.setState({ loading: true }, () => {
      card.API_create().then(() => {
        // this will close the blank card so no need to set loading: false
        this.closeBlankContentTool()
      })
    })
  }

  showVideoItemForm = () => {
    this.setState({ showVideoItemForm: true })
  }

  startCreatingCollection = () => {
    this.setState({ creatingCollection: true })
  }

  createCollection = () => {
    const attrs = {
      // `collection` is the collection being created within the card
      collection_attributes: {
        name: this.state.inputText,
      }
    }
    this.createCard(attrs)
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
          ${this.videoUrlIsValid ? '&#x2714;' : '&#x9675;'}
          <input
            onClick={this.createCollection}
            type="submit"
            value="save"
            disabled={this.state.loading}
          />
        </div>
      )
    } else if (this.state.showVideoItemForm) {
      return (
        <div>
          <input
            placeholder="Video URL"
            value={this.state.videoUrl}
            onChange={this.onVideoUrlChange}
          />
          <input
            onClick={this.createVideoItem}
            type="submit"
            value="save"
            disabled={this.state.loading}
          />
        </div>
      )
    }
    return (
      <div>
        <button onClick={this.startCreatingCollection}>
          Add Collection
          &nbsp;
          <Icon name="squarePlus" size="2rem" />
        </button>

        <button onClick={this.pickImage}>
          Add Image
          &nbsp;
          <Icon name="squarePlus" size="2rem" />
        </button>

        <button onClick={this.showVideoItemForm}>
          Add Video
          &nbsp;
          <Icon name="squarePlus" size="2rem" />
        </button>
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
          <button onClick={this.closeBlankContentTool}>
            <Icon name="close_grey" size="2rem" />
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
