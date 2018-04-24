import PropTypes from 'prop-types'
import styled from 'styled-components'
import Spinner from 'react-spinkit'
import { Flex, Box } from 'reflexbox'

import v from '~/utils/variables'

const StyledSpinner = styled(Spinner)`
  &.sk-spinner {
    height: 50px;
    margin: 0 auto;
    vertical-align: middle;
    width: 50px;
  }
`

const StyledFlex = styled(Flex)`
  background: rgba(255, 255, 255, 0.5);
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
`

const InlineLoader = ({ fadeIn }) => (
  <StyledFlex align="center" justify="center">
    <Box>
      <StyledSpinner
        fadeIn={fadeIn}
        name="folding-cube"
        color={v.colors.cloudy}
      />
    </Box>
  </StyledFlex>
)

InlineLoader.propTypes = {
  fadeIn: PropTypes.string,
}
InlineLoader.defaultProps = {
  fadeIn: 'half'
}

export default InlineLoader
