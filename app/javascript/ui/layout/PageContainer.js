import styled from 'styled-components'

import v from '~/ui/global/variables'

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

export default PageContainer
