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

const Logo = ({ height }) => (
  <Flex style={{ height }} align="center" justify="center">
    <Box>
      <StyledSpinner
        fadeIn="half"
        name="folding-cube"
        color={v.colors.cloudy}
      />
    </Box>
  </Flex>
)

Logo.propTypes = {
  height: PropTypes.string,
}
Logo.defaultProps = {
  height: '50vh',
}

export default Logo
