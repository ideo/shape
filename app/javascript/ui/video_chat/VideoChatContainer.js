import * as SWRTC from '@andyet/simplewebrtc'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import UserVideo from '~/ui/video_chat/UserVideo'

const StyledVideoCell = styled.div`
  margin: 0 10px 10px 0;
  display: inline-block;
  video {
    max-width: 200px;
    max-height: 200px;
  }
`

const VideoCell = (peer, peersLength) => {
  return (
    <StyledVideoCell>
      <SWRTC.RemoteMediaList
        peer={peer.address}
        render={({ media }) => (
          <UserVideo
            media={media}
            fullScreenActive={false}
            onlyVisible={peersLength === 1}
          />
        )}
      />
    </StyledVideoCell>
  )
}

class VideoChatContainer extends React.Component {
  render() {
    const { roomName, activeSpeakerView, userToken } = this.props

    return (
      <SWRTC.Provider
        configUrl={`https://api.simplewebrtc.com/config/user/${process.env.SIMPLE_WEB_RTC_API_KEY}`}
        userData={userToken}
      >
        <SWRTC.Connecting>
          <h4>Connecting...</h4>
        </SWRTC.Connecting>
        <SWRTC.Connected>
          {/* Request the user's media */}
          <SWRTC.RequestUserMedia audio video auto />

          {/* Enable playing remote audio. */}
          <SWRTC.RemoteAudioPlayer />

          {/* Connect to a room with a name and optional password */}
          <SWRTC.Room name={roomName}>
            {({ room }) => {
              /* Use the rest of the SWRTC React Components to render your UI */
              return (
                <>
                  <SWRTC.LocalMediaList
                    shared={true}
                    render={({ media }) => (
                      <StyledVideoCell>
                        <UserVideo media={media} fullScreenActive={false} />
                      </StyledVideoCell>
                    )}
                  />
                  <SWRTC.PeerList
                    room={room.address}
                    activeSpeakerView={activeSpeakerView}
                    render={({ peers }) => {
                      if (peers.length < 1)
                        return <h4>No one else is online</h4>
                      return (
                        <SWRTC.GridLayout
                          items={peers}
                          renderCell={peer => (
                            <VideoCell peer={peer} peersLength={peers.length} />
                          )}
                        />
                      )
                    }}
                  />
                </>
              )
            }}
          </SWRTC.Room>
        </SWRTC.Connected>
      </SWRTC.Provider>
    )
  }
}

VideoChatContainer.propTypes = {
  roomName: PropTypes.string.isRequired,
  userToken: PropTypes.string.isRequired,
  store: PropTypes.object.isRequired,
  activeSpeakerView: PropTypes.bool,
}

VideoChatContainer.defaultProps = {
  activeSpeakerView: false,
}

export default VideoChatContainer
