import PropTypes from 'prop-types'
import styled from 'styled-components'
import Spinner from 'react-spinkit'
import { Flex, Box } from 'reflexbox'

import v from '~/utils/variables'

const StyledSpinner = styled(Spinner)`
  &.sk-spinner {
    margin: 0 auto;
    vertical-align: middle;
    height: 100px;
    width: 100px;
  }
`

const Loader = ({ height, fadeIn }) => (
  <Flex style={{ height }} align="center" justify="center">
    <Box>
      <StyledSpinner
        fadeIn={fadeIn}
        name="folding-cube"
        color={v.colors.cloudy}
      />
    </Box>
  </Flex>
)

Loader.propTypes = {
  height: PropTypes.string,
  fadeIn: PropTypes.string,
}
Loader.defaultProps = {
  height: '50vh',
  fadeIn: 'half'
}

export default Loader
