import _ from 'lodash'
import PropTypes from 'prop-types'

import VideoUrl from '~/utils/VideoUrl'
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
      name: '',
      thumbnailUrl: '',
      meta: {},
    }
    this.canceled = false
    this.parseMetadata = _.debounce(this._parseMetadata, 500)
    this.lookupVideoAPI = _.debounce(this._lookupVideoAPI, 500)
  }

  componentWillUnmount() {
    this.canceled = true
  }

  onUrlChange = e => {
    const url = e.target.value
    const { type } = this.props
    this.setState({
      url,
      loading: true,
    })
    if (VideoUrl.isValid(url)) {
      return this.lookupVideoAPI(url)
    }
    if (type === 'video') {
      // Video does not accept normal generic links
      this.setState({
        urlValid: false,
        loading: false,
      })
      return false
    }
    return this.parseMetadata(url)
  }

  _parseMetadata = async url => {
    if (url.length <= 3) return
    const meta = await parseURLMeta(url)
    if (this.canceled) return
    this.setState({ loading: false })
    if (meta && (meta.title || meta.shapeLink)) {
      this.setState({
        meta,
        urlValid: 'link',
      })
    } else {
      this.setState({ urlValid: false })
    }
  }

  _lookupVideoAPI = async url => {
    const { name, thumbnailUrl } = await VideoUrl.getAPIdetails(url)
    if (this.canceled) return
    this.setState({ loading: false })
    if (name) {
      this.setState({ name, thumbnailUrl, urlValid: 'video' })
    } else {
      this.setState({ urlValid: false })
    }
  }

  createItem = e => {
    e.preventDefault()
    const { urlValid } = this.state
    if (!urlValid) return
    if (urlValid === 'link') {
      this.createLinkItem()
    } else if (urlValid === 'video') {
      this.createVideoItem()
    }
  }

  createVideoItem = () => {
    const { url, name, thumbnailUrl } = this.state
    // Get a normalized URL to make it easier to handle in our system
    const { normalizedUrl } = VideoUrl.parse(url)
    const attrs = {
      item_attributes: {
        type: ITEM_TYPES.VIDEO,
        url: normalizedUrl,
        name,
        thumbnail_url: thumbnailUrl,
      },
    }
    this.props.createCard(attrs)
  }

  createLinkItem = () => {
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
    const { type } = this.props
    const { url, urlValid } = this.state
    const loading = this.props.loading || this.state.loading

    return (
      <GenericLinkCreator
        url={url}
        urlValid={!!urlValid}
        placeholder={`${_.capitalize(type)} URL`}
        onSubmit={this.createItem}
        onChange={this.onUrlChange}
        onClose={this.props.closeBlankContentTool}
        loading={loading}
      />
    )
  }
}

LinkCreator.propTypes = {
  type: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
}

export default LinkCreator
