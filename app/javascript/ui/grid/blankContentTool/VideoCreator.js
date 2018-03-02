import PropTypes from 'prop-types'
import styled from 'styled-components'

import StyledCover from '~/ui/grid/covers/StyledCover'
import VideoUrl from '~/utils/VideoUrl'
import { ITEM_TYPES } from '~/utils/variables'

const ValidIndicator = styled.div`
  display: inline-block;
  font-size: 20px;
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
  state = {
    videoUrl: '',
  }

  onVideoUrlChange = (e) => {
    this.setState({
      videoUrl: e.target.value
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
          type: ITEM_TYPES.VIDEO,
          url: normalizedUrl
        },
      }
      this.props.createCard(attrs)
    } else {
      // console.log('invalid url')
    }
  }

  render() {
    let validIndicator = <ValidIndicator />

    if (this.state.videoUrl.length > 3) {
      validIndicator = (
        <ValidIndicator className={this.videoUrlIsValid() ? 'valid' : 'invalid'}>
          {this.videoUrlIsValid() ? '✔' : 'x'}
        </ValidIndicator>
      )
    }

    return (
      <StyledCover>
        <input
          placeholder="Video URL"
          value={this.state.videoUrl}
          onChange={this.onVideoUrlChange}
        />
        {validIndicator}
        <input
          onClick={this.createVideoItem}
          type="submit"
          value="save"
          disabled={this.props.loading}
        />
      </StyledCover>
    )
  }
}

VideoCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
}

export default VideoCreator
