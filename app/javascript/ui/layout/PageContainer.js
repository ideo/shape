import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledContainer = styled.main`
  display: block;
  max-width: ${v.maxWidth}px;
  margin: ${props => props.marginTop}px auto 0;
  padding: 0 ${v.containerPadding.horizontal}rem;
  position: relative;
`

const PageContainer = ({ children, marginTop }) => (
  <StyledContainer marginTop={marginTop}>{children}</StyledContainer>
)

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  marginTop: PropTypes.number,
}

PageContainer.defaultProps = {
  marginTop: v.headerHeight,
}

export default PageContainer
