import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import ReactPlayer from 'react-player'

const StyledVideoItem = styled.div`
  /* arbitrary styles for now */
  width: 1024px;
  height: 768px;
  max-width: 95vw;
  > div {
    height: 100%;
  }
`
StyledVideoItem.displayName = 'StyledVideoItem'

class VideoItem extends React.Component {
  render() {
    const { item } = this.props
    const videoUrl = item.url

    // ReactPlayer can play most external video server URLs
    // Examples: https://github.com/CookPete/react-player/blob/master/src/demo/App.js
    return (
      <StyledVideoItem>
        <ReactPlayer
          url={videoUrl}
          playing={false}
          controls
          width="1024"
          height="768"
        />
      </StyledVideoItem>
    )
  }
}

VideoItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default VideoItem
