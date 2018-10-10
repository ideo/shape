import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'
import ReactPlayer from 'react-player'

import v from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import { StyledImageCover } from './ImageItemCover'

const StyledVideoCover = styled.div`
  width: 100%;
  height: 100%;
  .inner {
    height: 100%;
    button {
      border: none;
      background: ${hexToRgba(v.colors.primaryLight, 0.75)};
      transition: background 0.2s;
      color: white;
      height: 4rem;
      width: 5rem;
      font-size: 2rem;
      border-radius: 10px;
      cursor: pointer;
      &:hover {
        background: ${v.colors.primaryLight};
      }
    }
  }
  .not-playing {
    display: ${props => (props.playing ? 'none' : 'block')};
  }
  .playing {
    height: 100%;
    display: ${props => (props.playing ? 'block' : 'none')};
  }
`
StyledVideoCover.displayName = 'StyledVideoCover'

class VideoItemCover extends React.PureComponent {
  // NOTE: this could later be managed in global state
  // e.g. only 1 video playing at a time, clicking outside could revert it back to non-playing mode
  // also -- could listen for pause events within the player so that we know when it's not playing
  state = {
    playing: false,
  }

  playVideo = () => {
    // don't play the video if we drag by grabbing the play button
    if (this.props.dragging) return
    // prevent GridCard handleClick handler, e.g. navigating to VideoItem
    this.setState({ playing: true })
  }

  render() {
    const { item } = this.props
    const url = item.thumbnail_url
    return (
      <StyledVideoCover playing={this.state.playing}>
        <StyledImageCover className="not-playing" url={url}>
          <Flex className="inner" align="center" justify="center">
            <Box>
              <button className="cancelGridClick" onClick={this.playVideo}>
                &#9658;
              </button>
            </Box>
          </Flex>
        </StyledImageCover>
        <div className="playing">
          <ReactPlayer
            url={item.url}
            controls
            playing={this.state.playing}
            width="100%"
            height="100%"
          />
        </div>
      </StyledVideoCover>
    )
  }
}

VideoItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
}

export default VideoItemCover
