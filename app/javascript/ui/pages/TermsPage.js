import ReactMarkdown from 'react-markdown'
import { DisplayText, DisplayLink } from '~/ui/global/styled/typography'
import styled from 'styled-components'
import v from '~/utils/variables'

import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import termsMarkdown from '~/markdown/TermsOfUse'

const StyledMarkdown = styled(ReactMarkdown)`
  h2 {
    font-size: 1rem;
  }
`
StyledMarkdown.displayName = 'StyledMarkdown'

const StyledTitle = DisplayText.extend`
  font-weight: ${v.weights.medium};
`

const StyledLink = DisplayLink.extend`
  margin-left: 80px;
  margin-bottom: 30px;
  font-weight: ${v.weights.medium};
  display: inline-block;
`

class TermsPage extends React.PureComponent {
  render() {
    return (
      <div>
        <Header />
        <PageContainer>
          <h1>Legal</h1>
          <StyledTitle>
            TERMS OF USE
          </StyledTitle>
          <StyledLink href="https://www.ideo.com/privacy" target="_blank">
            PRIVACY POLICY
          </StyledLink>
          <StyledMarkdown source={termsMarkdown} />
        </PageContainer>
      </div>
    )
  }
}

export default TermsPage
