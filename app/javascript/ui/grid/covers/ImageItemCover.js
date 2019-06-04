import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Viewer from 'react-viewer'
import 'react-viewer/dist/index.css'

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
  right: 5px;
  color: ${v.colors.white};
  cursor: pointer;
  .icon {
    width: 30px;
    height: 30px;
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

  get renderFullscreenImage() {
    const { fullscreen } = this.state
    return (
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
    )
  }

  render() {
    const { contain } = this.props
    return (
      <Fragment>
        {this.renderFullscreenImage}
        <StyledMagnifyIcon onClick={this.toggleFullscreen}>
          <SearchIcon />
        </StyledMagnifyIcon>
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
}

ImageItemCover.defaultProps = {
  contain: false,
}

export default ImageItemCover
