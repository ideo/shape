import _ from 'lodash'
import PropTypes from 'prop-types'

import parseURLMeta from '~/utils/parseURLMeta'
import { ITEM_TYPES } from '~/utils/variables'
import GenericLinkCreator from './GenericLinkCreator'

class LinkCreator extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      url: '',
      urlValid: false,
      loading: false,
      meta: {},
    }
    this.canceled = false
    this.parseMetadata = _.debounce(this._parseMetadata, 500)
  }

  componentWillUnmount() {
    this.canceled = true
  }

  onUrlChange = e => {
    const url = e.target.value
    this.setState({
      url,
      loading: true,
    })
    this.parseMetadata(url)
  }

  _parseMetadata = async url => {
    // TODO: VideoUrl.parse item to see if it is actually a video

    if (url.length <= 3) return
    const meta = await parseURLMeta(url)
    if (this.canceled) return
    this.setState({ loading: false })
    if (meta && (meta.title || meta.shapeLink)) {
      this.setState({
        meta,
        urlValid: true,
      })
    } else {
      this.setState({ urlValid: false })
    }
  }

  createLinkItem = async e => {
    e.preventDefault()
    if (!this.state.urlValid) return
    const { url, meta } = this.state
    let attrs = {
      item_attributes: {
        type: ITEM_TYPES.LINK,
        url,
        name: meta.title,
        content: meta.description,
        thumbnail_url: meta.image,
        icon_url: meta.icon,
      },
    }
    if (meta.shapeLink) {
      attrs = {
        type: 'CollectionCard::Link',
      }
      attrs[`${meta.recordType}_id`] = meta.recordId
    }
    this.props.createCard(attrs)
  }

  render() {
    const { url, urlValid } = this.state
    const loading = this.props.loading || this.state.loading

    return (
      <GenericLinkCreator
        url={url}
        urlValid={urlValid}
        placeholder="Link URL"
        onSubmit={this.createLinkItem}
        onChange={this.onUrlChange}
        onClose={this.props.closeBlankContentTool}
        loading={loading}
      />
    )
  }
}

LinkCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
}

export default LinkCreator
