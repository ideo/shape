import PropTypes from 'prop-types'
import styled from 'styled-components'

const StyledLogo = styled.div`
  margin-bottom: 15px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  /* NOTE: for the few browsers that don't support SVG, fallback to PNG will look bad for width > 83px */
  background-image: url('https://s3-us-west-2.amazonaws.com/assets.shape.space/logo_1x.png');
  background-image: url('https://s3-us-west-2.amazonaws.com/assets.shape.space/logo.svg');
  ${props => props.height === 83 &&
    `background-image: url('https://s3-us-west-2.amazonaws.com/assets.shape.space/logo_1x.png');
    @media
    (-webkit-min-device-pixel-ratio: 2),
    (min-resolution: 192dpi) {
      background-image: url('https://s3-us-west-2.amazonaws.com/assets.shape.space/logo.svg');`
}
}
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
`

const Logo = (props) => {
  const logoProps = { ...props }
  if (!logoProps.height) {
    // allow just width to be set, height will figure out based on aspect ratio
    logoProps.height = Math.floor(logoProps.width / 1.6)
  }
  return <StyledLogo {...logoProps} title="Shape" />
}

Logo.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
}
Logo.defaultProps = {
  width: 83,
  height: null,
}

export default Logo
