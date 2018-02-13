import styled from 'styled-components'

const StyledContainer = styled.main`
  margin-top: 90px;
  padding: 0 2rem;
`

const PageContainer = ({ children }) => (
  <StyledContainer>
    {children}
  </StyledContainer>
)

export default PageContainer
