import styled from 'styled-components'

const StyledLogo = styled.div`
  margin-bottom: 15px;
  width: 80px;
  height: 50px;
  background-image: url('https://s3-us-west-2.amazonaws.com/assets.shape.space/logo_1x.png');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  @media
  (-webkit-min-device-pixel-ratio: 2),
  (min-resolution: 192dpi) {
    background-image: url('https://s3-us-west-2.amazonaws.com/assets.shape.space/logo.svg');
  }
`
const Logo = () => (
  <StyledLogo title="Shape" />
)

export default Logo
