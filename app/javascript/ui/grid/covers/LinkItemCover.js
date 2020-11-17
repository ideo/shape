import PropTypes from 'prop-types'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import v from '~/utils/variables'
import { hexToRgba } from '~/utils/colorUtils'
import { GridCardIconWithName } from '~/ui/grid/shared'
import { CardHeading } from '~/ui/global/styled/typography'
import LinkIcon from '~/ui/icons/LinkIcon'
import { StyledImageCover } from './ImageItemCover'
import { coverTextClamp } from '~/utils/textUtils'

const StyledLinkCover = styled.div`
  background: ${v.colors.commonLight};
  cursor: pointer;
  width: 100%;
  height: 100%;
  .inner {
    &,
    & h1 {
      color: ${props => props.fontColor || v.colors.commonLight};
    }
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

@inject('uiStore')
@observer
class LinkItemCover extends React.Component {
  state = {
    iconError: false,
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
    const { item, cardHeight, listStyle, fontColor, uiStore } = this.props
    const { url, thumbnail_url } = item
    const { truncatedName, truncatedContent } = coverTextClamp({
      name: item.name,
      subtitle: item.subtitle,
      windowWidth: uiStore.windowWidth,
      cardHeight,
    })
    return (
      <StyledLinkCover fontColor={fontColor}>
        <StyledImageCover url={thumbnail_url} bgColor={v.colors.black}>
          {!this.isImage && (
            <Flex className="inner" align="center" justify="center">
              {!listStyle && (
                <Box style={{ width: '100%' }}>
                  <CardHeading className="name">{truncatedName}</CardHeading>
                  <p className="content">{truncatedContent}</p>
                  <GridCardIconWithName text={url} icon={this.icon} />
                </Box>
              )}
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
  fontColor: PropTypes.string,
  cardHeight: PropTypes.number,
  listStyle: PropTypes.bool,
}

LinkItemCover.defaultProps = {
  fontColor: 'inherit',
  cardHeight: 1,
  listStyle: false,
}

LinkItemCover.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default LinkItemCover
