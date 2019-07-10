import PropTypes from 'prop-types'
import { Box, Flex } from 'reflexbox'
import styled from 'styled-components'
import v from '~/utils/variables'

const StyledColumnFlexParent = ({ children }) => (
  <Flex column justify="flex-start">
    {children}
  </Flex>
)
StyledColumnFlexParent.propTypes = {
  children: PropTypes.node,
}
StyledColumnFlexParent.defaultProps = {
  children: null,
}

const StyledRowFlexParent = ({ children, column }) => (
  <Flex wrap justify="space-between" column={column}>
    {children}
  </Flex>
)
StyledRowFlexParent.propTypes = {
  children: PropTypes.node,
  column: PropTypes.bool,
}
StyledRowFlexParent.defaultProps = {
  children: null,
  column: false,
}

// flex-grow, flex-shrink and flex-basis combined
const StyledRowFlexItem = styled(Box)`
  width: 250px;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    /* width: 100px; */
  }
`

const StyledRowFlexCell = styled(StyledRowFlexItem)`
  width: 70px;
  padding-top: 15px;
  text-align: center;
  only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    width: 30px;
  }
`

const StyledRowFlexHeader = styled(StyledRowFlexCell)`
  padding-top: 0px;
  text-align: right;
`

const StyledLabelText = styled.span`
  margin-bottom: 0;
  margin-top: 15px;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  letter-spacing: 0.05rem;
  display: inline;
  vertical-align: middle;
`

const AudienceRowCell = styled(StyledRowFlexCell)`
  text-align: right;
`

export {
  StyledRowFlexCell,
  StyledRowFlexItem,
  StyledRowFlexHeader,
  StyledRowFlexParent,
  StyledColumnFlexParent,
  StyledLabelText,
  AudienceRowCell,
}
