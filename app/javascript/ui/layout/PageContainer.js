import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledContainer = styled.main`
  display: block;
  max-width: ${v.maxWidth}px;
  margin: 0 auto;
  padding: 0 ${v.containerPadding.horizontal}rem;
  position: relative;
`

const PageContainer = ({ children }) => (
  <StyledContainer>{children}</StyledContainer>
)

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
}

export default PageContainer
