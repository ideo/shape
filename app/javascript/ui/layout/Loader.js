import PropTypes from 'prop-types'
import styled from 'styled-components'
import { CubeGrid } from 'styled-loaders-react'
import { Flex, Box } from 'reflexbox'

import v from '~/utils/variables'

const StyledSpinner = styled(CubeGrid)`
  &.sk-spinner {
    margin: 0 auto;
    vertical-align: middle;
    height: ${props => props.size}px;
    width: ${props => props.size}px;
    margin-top: ${props => (props.enabled ? 8 : 2)}px;
  }
`
class Loader extends React.PureComponent {
  render() {
    const { containerHeight, size } = this.props
    return (
      <Flex style={{ height: containerHeight }} align="center" justify="center">
        <Box>
          <StyledSpinner color={v.colors.cloudy} size={`${size}px`} />
        </Box>
      </Flex>
    )
  }
}

Loader.propTypes = {
  containerHeight: PropTypes.string,
  size: PropTypes.number,
}
Loader.defaultProps = {
  containerHeight: '50vh',
  size: 100,
}

export default Loader
