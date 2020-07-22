import PropTypes from 'prop-types'
import * as SWRTC from '@andyet/simplewebrtc'

import Button from '~/ui/global/Button'

const VideoChatButton = ({
  roomName,
  joinedVideo,
  handleJoinVideo,
  handleLeaveVideo,
}) => {
  return (
    <SWRTC.PeerList
      room={roomName}
      render={({ peers }) => {
        if (!joinedVideo) {
          return (
            <React.Fragment>
              <Button onClick={() => handleJoinVideo()}>Join Video</Button>
              <i>{' ' + peers.length} people chatting</i>
            </React.Fragment>
          )
        } else {
          return <Button onClick={() => handleLeaveVideo()}>Leave Video</Button>
        }
      }}
    />
  )
}

VideoChatButton.propTypes = {
  roomName: PropTypes.string.isRequired,
  handleJoinVideo: PropTypes.func.isRequired,
  handleLeaveVideo: PropTypes.func.isRequired,
  joinedVideo: PropTypes.bool,
}

VideoChatButton.defaultProps = {
  joinedVideo: false,
}

export default VideoChatButton
