import React from 'react'
import PropTypes from 'prop-types'
import { CubeGrid } from 'styled-loaders-react'
import { Flex, Box } from 'reflexbox'

import v from '~/utils/variables'

const CircularLoader = ({ color }) => (
  <svg
    version="1.0"
    width="64px"
    height="64px"
    viewBox="0 0 128 128"
    xmlSpace="preserve"
  >
    <path
      fill={color}
      fillOpacity="1"
      d="M64.4 16a49 49 0 0 0-50 48 51 51 0 0 0 50 52.2 53 53 0 0 0 54-52c-.7-48-45-55.7-45-55.7s45.3 3.8 49 55.6c.8 32-24.8 59.5-58 60.2-33 .8-61.4-25.7-62-60C1.3 29.8 28.8.6 64.3 0c0 0 8.5 0 8.7 8.4 0 8-8.6 7.6-8.6 7.6z"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 64 64"
        to="360 64 64"
        dur="1600ms"
        repeatCount="indefinite"
      ></animateTransform>
    </path>
  </svg>
)

CircularLoader.propTypes = {
  color: PropTypes.string.isRequired,
}

class Loader extends React.PureComponent {
  render() {
    const { containerHeight, animation, size, color } = this.props
    // note "circular" SVG does not respect "size" prop
    const LoaderAnimation = animation === 'circular' ? CircularLoader : CubeGrid
    return (
      <Flex style={{ height: containerHeight }} align="center" justify="center">
        <Box>
          <LoaderAnimation color={color} size={`${size}px`} />
        </Box>
      </Flex>
    )
  }
}

Loader.propTypes = {
  containerHeight: PropTypes.string,
  size: PropTypes.number,
  animation: PropTypes.oneOf(['cube', 'circular']),
  color: PropTypes.string,
}
Loader.defaultProps = {
  containerHeight: '50vh',
  size: 100,
  animation: 'circular',
  color: v.colors.commonDark,
}

export default Loader
