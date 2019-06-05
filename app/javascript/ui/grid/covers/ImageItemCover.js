import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Viewer from 'react-viewer'
// 'react-viewer/dist/index.css' is imported in application.scss
// to get it to work on Heroku

import SearchIcon from '~/ui/icons/SearchIcon'
import v from '~/utils/variables'

export const StyledImageCover = styled.div`
  ${props => props.url && `background-image: url(${props.url});`}
  ${props => props.bgColor && `background-color: ${props.bgColor};`}
  background-size: ${props => (props.contain ? 'contain' : 'cover')};
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
  cursor: pointer;
`
StyledImageCover.displayName = 'StyledImageCover'

const StyledMagnifyIcon = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  padding: 8px 0 0 12px;
  border-radius: 4px;
  width: 35px;
  height: 35px;
  background-color: ${v.colors.commonMedium};
  text-align: center;
  color: ${v.colors.secondaryDarkest};
  .icon {
    width: 35px;
    height: 35px;
    margin: auto;
  }
`

class ImageItemCover extends React.Component {
  state = {
    fullscreen: false,
  }

  toggleFullscreen = () => {
    const { fullscreen } = this.state
    this.setState({ fullscreen: !fullscreen })
  }

  get imageUrl() {
    const { item } = this.props
    const retina = window.devicePixelRatio && window.devicePixelRatio > 1
    return item.imageUrl({ resize: { width: retina ? 2400 : 1200 } })
  }

  get renderFullscreenImageViewer() {
    const { fullscreen } = this.state
    return (
      <Fragment>
        <StyledMagnifyIcon onClick={this.toggleFullscreen}>
          <SearchIcon />
        </StyledMagnifyIcon>
        <Viewer
          images={[{ src: this.imageUrl, alt: '' }]}
          visible={fullscreen}
          onClose={this.toggleFullscreen}
          onMaskClick={this.toggleFullscreen}
          rotatable={false}
          scalable={false}
          zIndex={1000}
          drag={true}
          changeable={false}
          noImgDetails={true}
          downloadable={false}
          noNavbar={true}
          zoomSpeed={0.25}
        />
      </Fragment>
    )
  }

  render() {
    const {
      contain,
      isTestCollectionCard,
      item: { can_view },
    } = this.props
    const showFullscreenViewer = isTestCollectionCard && !can_view
    return (
      <Fragment>
        {showFullscreenViewer && this.renderFullscreenImageViewer}
        <StyledImageCover
          url={this.imageUrl}
          contain={contain}
          onClick={this.toggleFullscreen}
        />
      </Fragment>
    )
  }
}

ImageItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  contain: PropTypes.bool,
  isTestCollectionCard: PropTypes.bool,
}

ImageItemCover.defaultProps = {
  contain: false,
  isTestCollectionCard: false,
}

export default ImageItemCover
