import PropTypes from 'prop-types'
import ReactPlayer from 'react-player'
import { StyledTopLeftActions } from '~/ui/grid/shared'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import DragIcon from '~/ui/icons/DragIcon'
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
    let player

    if (videoId.service !== 'vbrick' && !vimeoError) {
      let onError = null
      if (videoId.service === 'vimeo') {
        onError = this.catchVimeoError
      }
      player = <ReactPlayer {...this.props} onError={onError} />
    } else {
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
      player = (
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
    return (
      <div style={{ height: '100%', position: 'relative' }}>
        <StyledTopLeftActions className="show-on-hover">
          <span className={`videoDrag`}>
            <CardActionHolder className="show-on-hover" disableHover>
              <DragIcon />
            </CardActionHolder>
          </span>
        </StyledTopLeftActions>
        <div
          style={{
            height: '100%',
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        >
          {player}
        </div>
      </div>
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
