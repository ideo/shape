import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledContainer = styled.main`
  max-width: 1300px;
  margin: ${v.headerHeight}px auto 0;
  padding: 0 2rem;
`

const PageContainer = ({ children }) => (
  <StyledContainer>
    {children}
  </StyledContainer>
)

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
}

export default PageContainer
