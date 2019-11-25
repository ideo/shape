import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledPageContainer = styled.div`
  display: block;
  margin: ${props => props.marginTop}px auto 0;
  ${props =>
    !props.fullWidth &&
    `
    max-width: ${v.maxWidth}px;
  `}
  padding: 0 ${props => props.padding}rem;
  position: relative;
`

const PageContainer = ({ children, fullWidth, padding, marginTop }) => (
  <StyledPageContainer
    data-empty-space-click
    fullWidth={fullWidth}
    padding={padding}
    marginTop={marginTop}
  >
    {children}
  </StyledPageContainer>
)

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  fullWidth: PropTypes.bool,
  padding: PropTypes.number,
  marginTop: PropTypes.number,
}

PageContainer.defaultProps = {
  fullWidth: false,
  padding: v.containerPadding.horizontal,
  marginTop: 0,
}

export default PageContainer
