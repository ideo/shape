import PropTypes from 'prop-types'
import styled from 'styled-components'
import _ from 'lodash'

import { TextField, FormButton } from '~/ui/global/styled/forms'
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import VideoUrl from '~/utils/VideoUrl'
import { ITEM_TYPES, KEYS } from '~/utils/variables'

const ValidIndicator = styled.div`
  position: absolute;
  top: 18px;
  right: -24px;
  font-size: 1.25rem;
  font-weight: bold;
  width: 20px;
  &.valid {
    color: green;
  }
  &.invalid {
    color: red;
  }
`

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
    this.lookupVideoAPI = _.debounce(this._lookupVideoAPI, 1000)
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

  handleKeyDown = (e) => {
    if (e.keyCode === KEYS.ESC) {
      this.props.closeBlankContentTool()
    }
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
    // console.log('invalid url')
  }

  render() {
    let validIndicator = <ValidIndicator />
    const { videoUrl, urlValid, loading } = this.state

    if (videoUrl.length > 3) {
      validIndicator = (
        <ValidIndicator className={urlValid ? 'valid' : 'invalid'}>
          {!loading && (urlValid ? '✔' : 'x')}
          {loading && '...'}
        </ValidIndicator>
      )
    }

    return (
      <PaddedCardCover>
        <form className="form" onSubmit={this.createVideoItem}>
          <TextField
            placeholder="Video URL"
            value={videoUrl}
            onChange={this.onVideoUrlChange}
            onKeyDown={this.handleKeyDown}
          />
          {validIndicator}
          <FormButton
            disabled={this.props.loading || this.state.loading}
          >
            Add
          </FormButton>
        </form>
      </PaddedCardCover>
    )
  }
}

VideoCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
}

export default VideoCreator
