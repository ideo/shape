import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import ReactPlayer from 'react-player'

export const StyledVideoItem = styled.div`
  width: 100%;
  height: 100%;
`
StyledVideoItem.displayName = 'StyledVideoItem'

class VideoItem extends React.Component {
  render() {
    const { item } = this.props
    const videoUrl = item.url

    // ReactPlayer can play most external video server URLs
    // Examples: https://github.com/CookPete/react-player/blob/master/src/demo/App.js
    return (
      <ReactPlayer
        url={videoUrl}
        playing={false}
        controls={false}
        width="100%"
        height="100%"
      />
    )
  }
}

VideoItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default VideoItem
