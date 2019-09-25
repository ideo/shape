import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledPageContainer = styled.div`
  display: block;
  margin: 0 auto;
  ${props =>
    !props.fullWidth &&
    `
    max-width: ${v.maxWidth}px;
  `}
  padding: 0 ${props => props.padding}rem;
  position: relative;
`

const PageContainer = ({ children, fullWidth, padding }) => (
  <StyledPageContainer
    data-empty-space-click
    fullWidth={fullWidth}
    padding={padding}
  >
    {children}
  </StyledPageContainer>
)

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  fullWidth: PropTypes.bool,
  padding: PropTypes.number,
}

PageContainer.defaultProps = {
  fullWidth: false,
  padding: v.containerPadding.horizontal,
}

export default PageContainer
