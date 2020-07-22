import * as SWRTC from '@andyet/simplewebrtc'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'

import UserVideo from '~/ui/video_chat/UserVideo'

class VideoChatContainer extends React.Component {
  @observer
  hiddenPeers = []

  render() {
    const { roomName, activeSpeakerView } = this.props

    return (
      <>
        <SWRTC.Connecting>
          <h1>Connecting...</h1>
        </SWRTC.Connecting>

        <SWRTC.Connected>
          <h1>Connected!</h1>
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
                  In Room {roomName}
                  <SWRTC.PeerList
                    roomAddress={room.address}
                    activeSpeakerView={activeSpeakerView}
                    render={({ peers }) => {
                      const visiblePeers = peers.filter(
                        p => !this.hiddenPeers.includes(p.id)
                      )
                      return (
                        <SWRTC.GridLayout
                          items={visiblePeers}
                          renderCell={peer => (
                            <SWRTC.RemoteMediaList
                              peer={peer.address}
                              render={({ media }) => (
                                <UserVideo
                                  media={media}
                                  fullScreenActive={false}
                                  onlyVisible={visiblePeers.length === 1}
                                />
                              )}
                            />
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
      </>
    )
  }
}

VideoChatContainer.propTypes = {
  roomName: PropTypes.string.isRequired,
  store: PropTypes.node.isRequired,
  activeSpeakerView: PropTypes.bool,
}

VideoChatContainer.defaultProps = {
  activeSpeakerView: false,
}

export default VideoChatContainer
