import PropTypes from 'prop-types'
import styled from 'styled-components'
import { MoonLoader } from 'react-spinners'
import { Flex, Box } from 'reflexbox'

import v from '~/utils/variables'

const StyledSpinner = styled(MoonLoader)`
  &.sk-spinner {
    margin: 0 auto;
    vertical-align: middle;
    height: ${props => props.size}px;
    width: ${props => props.size}px;
    margin-top: ${props => (props.enabled ? 8 : 2)}px;
  }
`

const Loader = ({ containerHeight, size, fadeIn }) => (
  <Flex style={{ height: containerHeight }} align="center" justify="center">
    <Box>
      <StyledSpinner
        color={v.colors.cloudy}
        size={size}
      />
    </Box>
  </Flex>
)

Loader.propTypes = {
  containerHeight: PropTypes.string,
  size: PropTypes.number,
  fadeIn: PropTypes.string,
}
Loader.defaultProps = {
  containerHeight: '50vh',
  size: 100,
  fadeIn: 'half'
}

export default Loader
