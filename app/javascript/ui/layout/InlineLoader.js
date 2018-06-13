import PropTypes from 'prop-types'
import styled from 'styled-components'
import Loader from '~/ui/layout/Loader'
import v from '~/utils/variables'

const StyledFlex = styled.div`
  background: ${props => (props.background === 'cloudy'
    ? 'rgba(255, 255, 255, 0.5)' : 'none'
  )};
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  left: 0;
  position: ${props => (props.fixed ? 'fixed' : 'absolute')};
  top: 0;
  width: 100%;
  z-index: ${v.zIndex.gridCard};
`

const InlineLoader = ({ fixed, background }) => (
  <StyledFlex fixed={fixed} background={background}>
    <Loader fadeIn="half" height="30px" size={30} />
  </StyledFlex>
)

InlineLoader.propTypes = {
  fixed: PropTypes.bool,
  background: PropTypes.string,
}
InlineLoader.defaultProps = {
  fixed: false,
  background: 'cloudy',
}

export default InlineLoader
