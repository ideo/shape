import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import { StyledTopLeftActions } from '~/ui/grid/shared'
import { FullAbsolute, FullAbsoluteParent } from '~/ui/global/styled/layout'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import { DisplayText } from '~/ui/global/styled/typography'
import DragIcon from '~/ui/icons/DragIcon'
import AddVideoIcon from '~/ui/icons/AddVideoIcon'
import v from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import VideoPlayer from '~/ui/items/VideoPlayer'
import Activity from '~/stores/jsonApi/Activity'
import { StyledImageCover } from './ImageItemCover'

const StyledVideoCover = styled.div`
  background: ${v.colors.commonLight};
  width: 100%;
  height: 100%;
  .inner {
    height: 100%;
    position: absolute;
    width: 100%;
    z-index: ${v.zIndex.gridCardBg};
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
    z-index: ${v.zIndex.gridCardBg};
  }
  ${props =>
    props.pending &&
    `
    background: ${v.colors.commonDark};
    height: calc(100% - 40px);
    padding-left: 30px;
    padding-right: 30px;
    padding-top: 40px;
    text-align: center;
    width: calc(100% - 60px);
  `};
`
StyledVideoCover.displayName = 'StyledVideoCover'

const InfoIconHolder = styled.span`
  display: inline-block;
  height: 60px;
  width: 60px;
`

@observer
class VideoItemCover extends React.Component {
  state = {
    playing: false,
  }

  get videoUrl() {
    const { item } = this.props
    if (item.filestack_file) {
      return item.fileUrl()
    }
    return item.url
  }

  playVideo = () => {
    const { item, dragging } = this.props
    // don't play the video if we drag by grabbing the play button
    if (dragging) return
    // prevent GridCard handleClick handler, e.g. navigating to VideoItem
    this.setState({ playing: true })
    Activity.trackActivity('viewed', item)
  }

  render() {
    const { item } = this.props
    const thumbnail = item.thumbnail_url
    const showPlayer = !thumbnail

    if (item.pending_transcoding) {
      return (
        <StyledVideoCover pending={item.pending_transcoding}>
          <DisplayText color={v.colors.white}>
            <InfoIconHolder>
              <AddVideoIcon />
            </InfoIconHolder>
            <br />
            Your video upload is currently processing.
            <br />
            Please check back later.
          </DisplayText>
        </StyledVideoCover>
      )
    }

    return (
      <StyledVideoCover playing={this.state.playing || showPlayer}>
        {thumbnail && (
          <StyledImageCover
            className="not-playing"
            url={thumbnail}
            bgColor={v.colors.commonDark}
          >
            <Flex className="inner" align="center" justify="center">
              <Box>
                <button className="cancelGridClick" onClick={this.playVideo}>
                  &#9658;
                </button>
              </Box>
            </Flex>
            <div className="overlay" />
          </StyledImageCover>
        )}
        <div className="playing">
          <FullAbsoluteParent>
            <StyledTopLeftActions className="show-on-hover">
              <CardActionHolder className="show-on-hover" disableHover>
                <DragIcon />
              </CardActionHolder>
            </StyledTopLeftActions>
            <FullAbsolute>
              <VideoPlayer
                url={this.videoUrl}
                controls
                playing={this.state.playing}
                width="100%"
                height="100%"
              />
            </FullAbsolute>
          </FullAbsoluteParent>
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
