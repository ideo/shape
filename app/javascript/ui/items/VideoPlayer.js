import PropTypes from 'prop-types'
import ReactPlayer from 'react-player'

import VideoUrl from '~/utils/VideoUrl'

class VideoPlayer extends React.PureComponent {
  state = {
    vimeoError: false,
  }

  catchVimeoError = () => {
    this.setState({
      vimeoError: true,
    })
  }

  render() {
    const { vimeoError } = this.state
    const { url, width, height, playing } = this.props
    const videoId = VideoUrl.getVideoId(url)
    let embedSrc = ''

    if (videoId.service !== 'vbrick' && !vimeoError) {
      let onError = null
      if (videoId.service === 'vimeo') {
        onError = this.catchVimeoError
      }
      return <ReactPlayer {...this.props} onError={onError} />
    }
    if (videoId.service === 'vbrick') {
      embedSrc = `https://ford.rev.vbrick.com/embed?id=${videoId.id}`
      if (playing) {
        embedSrc += '&autoplay'
      }
    } else {
      embedSrc = `https://player.vimeo.com/video/${videoId.id}`
      if (playing) {
        // NOTE: chrome and some browsers require mute in order to autoplay
        embedSrc += '?autoplay=1'
      }
    }
    return (
      <iframe
        style={{ backgroundColor: 'black' }}
        title="video player"
        width={width}
        height={height}
        src={embedSrc}
        frameBorder="0"
        allowFullScreen
      />
    )
  }
}

VideoPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  width: PropTypes.string.isRequired,
  height: PropTypes.string.isRequired,
  playing: PropTypes.bool.isRequired,
}

export default VideoPlayer
