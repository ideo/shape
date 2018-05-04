import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

import { SimpleHeading1, DisplayText, DisplayLink } from '~/ui/global/styled/typography'
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
  text-transform: uppercase;
`

const StyledLink = DisplayLink.extend`
  text-transform: uppercase;
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
        <PageContainer marginTop={v.headerHeightCompact}>
          <SimpleHeading1>Legal</SimpleHeading1>
          <StyledTitle>
            Terms of Use
          </StyledTitle>
          <StyledLink href="https://www.ideo.com/privacy" target="_blank">
            Privacy Policy
          </StyledLink>
          <StyledMarkdown source={termsMarkdown} />
        </PageContainer>
      </div>
    )
  }
}

export default TermsPage
