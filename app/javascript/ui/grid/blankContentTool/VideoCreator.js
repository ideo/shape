import _ from 'lodash'
import PropTypes from 'prop-types'

import VideoUrl from '~/utils/VideoUrl'
import { ITEM_TYPES } from '~/utils/variables'
import GenericLinkCreator from './GenericLinkCreator'

class VideoCreator extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      videoUrl: '',
      urlValid: false,
      loading: false,
      name: '',
      thumbnailUrl: '',
    }
    this.canceled = false
    this.lookupVideoAPI = _.debounce(this._lookupVideoAPI, 500)
  }

  componentWillUnmount() {
    this.canceled = true
  }

  onVideoUrlChange = (e) => {
    this.setState({
      videoUrl: e.target.value,
      loading: true,
    })
    this.lookupVideoAPI(e.target.value)
  }

  _lookupVideoAPI = async (url) => {
    const { name, thumbnailUrl } = await VideoUrl.getAPIdetails(url)
    if (this.canceled) return
    this.setState({ loading: false })
    if (name && thumbnailUrl) {
      this.setState({ name, thumbnailUrl, urlValid: true })
    } else {
      this.setState({ urlValid: false })
    }
  }

  videoUrlIsValid = () => (
    VideoUrl.isValid(this.state.videoUrl)
  )

  createVideoItem = (e) => {
    e.preventDefault()
    if (this.videoUrlIsValid()) {
      // Get a normalized URL to make it easier to handle in our system
      const { normalizedUrl } = VideoUrl.parse(this.state.videoUrl)
      const { name, thumbnailUrl } = this.state
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
  }

  render() {
    const { videoUrl, urlValid } = this.state
    const loading = this.props.loading || this.state.loading

    return (
      <GenericLinkCreator
        url={videoUrl}
        urlValid={urlValid}
        placeholder="Video URL"
        onSubmit={this.createVideoItem}
        onChange={this.onVideoUrlChange}
        onClose={this.props.closeBlankContentTool}
        loading={loading}
      />
    )
  }
}

VideoCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
}

export default VideoCreator
