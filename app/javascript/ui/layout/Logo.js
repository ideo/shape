import PropTypes from 'prop-types'
import styled from 'styled-components'

const StyledLogo = styled.div`
  margin-bottom: ${props => (props.withText ? 15 : 0)}px;
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
  const urlSuffix = props.withText ? '' : '-no-text'
  const assetUrl = `https://s3-us-west-2.amazonaws.com/assets.shape.space/logo${urlSuffix}`

  if (!logoProps.height) {
    // allow just width to be set, height will figure out based on aspect ratio
    // CAUTION: changing this ratio / height can affect the height of the global header
    const ratio = props.withText ? 1.6 : 1.75
    logoProps.height = Math.floor(logoProps.width / ratio)
  }
  return <StyledLogo {...logoProps} assetUrl={assetUrl} title="Shape" />
}

Logo.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  withText: PropTypes.bool,
}
Logo.defaultProps = {
  width: 46,
  height: null,
  withText: false,
}

export default Logo
