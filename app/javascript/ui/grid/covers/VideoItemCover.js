import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import ReactPlayer from 'react-player'

const StyledCover = styled.div`
  background: black;
  height: 100%;
  width: 100%;
  position: relative;
`
StyledCover.displayName = 'StyledCover'

class VideoItemCover extends React.Component {
  render() {
    const { item } = this.props
    const videoUrl = item.url

    // ReactPlayer can play most external video server URLs
    // Examples: https://github.com/CookPete/react-player/blob/master/src/demo/App.js
    return (
      <StyledCover>
        <ReactPlayer
          url={videoUrl}
          playing={false}
          controls={false}
          width="95%"
          height="95%"
        />
      </StyledCover>
    )
  }
}

VideoItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default VideoItemCover
