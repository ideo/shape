import styled from 'styled-components'
import Spinner from 'react-spinkit'
import { Flex, Box } from 'reflexbox'

const StyledSpinner = styled(Spinner)`
  &.sk-spinner {
    margin: 0 auto;
    vertical-align: middle;
    height: 100px;
    width: 100px;
  }
`

const Logo = () => (
  <Flex style={{ height: '50vh' }} align="center" justify="center">
    <Box>
      <StyledSpinner
        fadeIn="half"
        name="folding-cube"
        color="#00bfa3"
      />
    </Box>
  </Flex>
)

export default Logo
