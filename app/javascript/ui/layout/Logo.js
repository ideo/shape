import PropTypes from 'prop-types'
import styled from 'styled-components'

// TODO: Where is this PNG fallback ever used? The only browser that doesn't support is IE8 which is incompatible with React
// https://caniuse.com/#feat=svg
// https://facebook.github.io/create-react-app/docs/supported-browsers-features
const StyledLogo = styled.div`
  margin-bottom: ${props => (props.noText ? 0 : 15)}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  /* NOTE: for the few browsers that don't support SVG, fallback to PNG will look bad for width > 83px */
  background-image: url('${props => props.assetUrl}_1x.png');
  background-image: url('${props => props.assetUrl}.svg');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
`

const Logo = props => {
  const logoProps = { ...props }
  const urlSuffix = props.noText ? '-no-text' : ''
  let assetUrl = `https://s3-us-west-2.amazonaws.com/assets.shape.space/logo${urlSuffix}`

  if (!logoProps.height) {
    // allow just width to be set, height will figure out based on aspect ratio
    // CAUTION: changing this ratio / height can affect the height of the global header
    const ratio = props.noText ? 1.75 : 1.6
    logoProps.height = Math.floor(logoProps.width / ratio)
  }
  return <StyledLogo {...logoProps} assetUrl={assetUrl} title="Shape" />
}

Logo.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  noText: PropTypes.bool,
}
Logo.defaultProps = {
  width: 83,
  height: null,
  noText: false,
}

export default Logo
