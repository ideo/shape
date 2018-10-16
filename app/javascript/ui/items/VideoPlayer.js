import PropTypes from 'prop-types'
import ReactPlayer from 'react-player'

import VideoUrl from '~/utils/VideoUrl'

class VideoPlayer extends React.PureComponent {
  render() {
    const { url, width, height, playing } = this.props
    const videoId = VideoUrl.getVideoId(url)

    if (videoId.service === 'vbrick') {
      let embedSrc = `https://ford.rev.vbrick.com/embed?id=${videoId.id}`
      if (playing) {
        embedSrc += '&autoplay'
      }
      return (
        <iframe
          title="vbrick"
          width={width}
          height={height}
          src={embedSrc}
          frameBorder="0"
          allowFullScreen
        />
      )
    }
    return <ReactPlayer {...this.props} />
  }
}

VideoPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  width: PropTypes.string.isRequired,
  height: PropTypes.string.isRequired,
  playing: PropTypes.bool.isRequired,
}

export default VideoPlayer
