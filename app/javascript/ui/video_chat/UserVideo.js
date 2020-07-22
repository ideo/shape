import { Video, AudioOnlyPeer } from '@andyet/simplewebrtc'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const LoadingVideo = ({ media, qualityProfile }) => {
  if (!media.loaded) {
    return <AudioOnlyPeer />
  }
  return (
    <Video
      media={media}
      qualityProfile={media.screenCapture ? undefined : qualityProfile}
    />
  )
}

LoadingVideo.propTypes = {
  media: PropTypes.array,
  qualityProfile: PropTypes.string,
}

LoadingVideo.defaultProps = {
  media: [],
  qualityProfile: 'low',
}

const PictureInPictureContainer = styled.div`
  position: relative;
  display: flex;
  justifycontent: center;
  alignitems: center;
  height: 100%;
  width: 100%;
`

const UserVideo = ({ media, fullScreenActive, onlyVisible }) => {
  const videoStreams = media.filter(
    m => m.kind === 'video' && !m.remoteDisabled
  )
  if (videoStreams.length > 0) {
    const webcamStreams = videoStreams.filter(s => !s.screenCapture)
    const screenCaptureStreams = videoStreams.filter(s => s.screenCapture)
    if (videoStreams.length === 1) {
      return (
        <LoadingVideo
          media={videoStreams[0]}
          qualityProfile={fullScreenActive ? 'high' : 'medium'}
        />
      )
    }
    if (screenCaptureStreams.length === 0) {
      return (
        <LoadingVideo
          media={webcamStreams[0]}
          qualityProfile={fullScreenActive ? 'high' : 'medium'}
        />
      )
    }
    return (
      <PictureInPictureContainer>
        {/* Screenshare */}
        <LoadingVideo media={screenCaptureStreams[0]} />
        {/* Camera */}
        <Video media={webcamStreams[0]} qualityProfile="low" />
      </PictureInPictureContainer>
    )
  }
  return <AudioOnlyPeer />
}

UserVideo.propTypes = {
  media: PropTypes.array,
  fullScreenActive: PropTypes.bool,
  onlyVisible: PropTypes.bool,
}

UserVideo.defaultProps = {
  media: [],
  fullScreenActive: false,
  onlyVisible: false,
}

export default UserVideo
