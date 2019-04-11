import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledContainer = styled.main`
  display: block;
  margin: 0 auto;
  ${props =>
    !props.fullWidth &&
    `
    max-width: ${v.maxWidth}px;
  `}
  padding: 0 ${v.containerPadding.horizontal}rem;
  position: relative;
`

const PageContainer = ({ children, fullWidth }) => (
  <StyledContainer data-deselect-on-click fullWidth={fullWidth}>
    {children}
  </StyledContainer>
)

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  fullWidth: PropTypes.bool,
}

PageContainer.defaultProps = {
  fullWidth: false,
}

export default PageContainer
