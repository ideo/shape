import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import v from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import { GridCardIconWithName } from '~/ui/grid/shared'
import { CardHeading } from '~/ui/global/styled/typography'
import LinkIcon from '~/ui/icons/LinkIcon'
import { uiStore } from '~/stores'
import { StyledImageCover } from './ImageItemCover'

const StyledLinkCover = styled.div`
  background: ${v.colors.commonLight};
  color: ${v.colors.commonLight};
  cursor: pointer;
  width: 100%;
  height: 100%;
  .inner {
    box-sizing: border-box;
    height: 100%;
    padding: 20px 20px;
    padding-bottom: 60px;
    position: absolute;
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
`
StyledLinkCover.displayName = 'StyledLinkCover'

@observer
class LinkItemCover extends React.Component {
  state = {
    iconError: false,
  }

  clamp() {
    const textBreakpoints = [
      {
        desiredNameLen: 53,
        desiredContentLen: 90,
      },
      {
        breakpoint: v.responsive.smallBreakpoint,
        desiredNameLen: 46,
        desiredContentLen: 79,
      },
      {
        breakpoint: v.responsive.medBreakpoint,
        desiredNameLen: 35,
        desiredContentLen: 61,
      },
      {
        breakpoint: v.responsive.largeBreakpoint,
        desiredNameLen: 40,
        desiredContentLen: 80,
      },
    ]
    let { desiredNameLen, desiredContentLen } = textBreakpoints.reduce(
      (prev, i) =>
        i.breakpoint && uiStore.windowWidth > i.breakpoint ? i : prev,
      textBreakpoints[0]
    )
    const { item, cardHeight } = this.props
    if (cardHeight > 1) {
      desiredNameLen *= 2
      desiredContentLen *= 2
    }
    const { name, content } = item
    let truncatedName = name || ''
    let truncatedContent = content || ''
    if (name && name.length > desiredNameLen) {
      // In this case, the title will be over 3 lines, so don't display
      // any content and truncate the title somewhat in the middle
      truncatedContent = ''
      const desiredLength = desiredNameLen - 2 // two extra chars for ellipsis and space
      const first = name.slice(0, desiredLength / 2)
      const second = name.slice(name.length - desiredLength / 2, name.length)
      truncatedName = `${first}… ${second}`
    } else if (content && content.length > desiredContentLen) {
      const desiredLength = desiredContentLen - 1 // one extra char for ellipsis
      const first = content.slice(0, desiredLength)
      truncatedContent = `${first}…`
      truncatedName = name
    }
    return {
      truncatedName,
      truncatedContent,
    }
  }

  get icon() {
    const { item } = this.props
    if (!this.state.iconError && item.icon_url) {
      return (
        <img
          onError={() => this.setState({ iconError: true })}
          alt="link icon"
          src={item.icon_url}
        />
      )
    }
    return (
      // fallback if the icon didn't work
      <LinkIcon />
    )
  }

  get isImage() {
    const {
      item: { url },
    } = this.props
    return url.match(/\.(jpeg|jpg|gif|png)$/) !== null
  }

  render() {
    const { item } = this.props
    const { url, thumbnail_url } = item
    const { truncatedName, truncatedContent } = this.clamp()
    return (
      <StyledLinkCover>
        <StyledImageCover url={thumbnail_url} bgColor={v.colors.black}>
          {!this.isImage && (
            <Flex className="inner" align="center" justify="center">
              <Box style={{ width: '100%' }}>
                <CardHeading className="name">{truncatedName}</CardHeading>
                <p className="content">{truncatedContent}</p>
                <GridCardIconWithName text={url} icon={this.icon} />
              </Box>
            </Flex>
          )}
          <div className="overlay" />
        </StyledImageCover>
      </StyledLinkCover>
    )
  }
}

LinkItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  cardHeight: PropTypes.number,
}

LinkItemCover.defaultProps = {
  cardHeight: 1,
}

export default LinkItemCover
