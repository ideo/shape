import ReactMarkdown from 'react-markdown'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import { apiStore } from '~/stores'
import {
  Heading1,
  DisplayText,
  DisplayLink,
  QuillStyleWrapper,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import Header, { BasicHeader } from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import termsMarkdown from '~/markdown/TermsOfUse'
import OverdueBanner from '~/ui/layout/OverdueBanner'

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
    let inner
    inner = (
      <div>
        <StyledTitle>Terms of Use</StyledTitle>
        <StyledLink href="https://www.ideo.com/privacy" target="_blank">
          Privacy Policy
        </StyledLink>
        <StyledMarkdown source={termsMarkdown} />
      </div>
    )
    if (this.props.location.pathname !== '/terms') {
      const organization = apiStore.currentUserOrganization
      const quillProps = {
        readOnly: true,
        theme: null,
      }
      const textData = organization.terms_text_item.toJSON().text_data
      inner = (
        <div>
          <StyledTitle>{organization.name} Terms of Use</StyledTitle>
          <QuillStyleWrapper style={{ marginTop: '1.5rem' }}>
            <ReactQuill {...quillProps} value={textData} />
          </QuillStyleWrapper>
        </div>
      )
    }
    const loggedIn = !!apiStore.currentUser
    return (
      <div>
        {loggedIn ? <Header /> : <BasicHeader />}
        <PageContainer marginTop={v.headerHeightCompact}>
          <Heading1>Legal</Heading1>
          {loggedIn && <OverdueBanner />}
          {inner}
        </PageContainer>
      </div>
    )
  }
}

export default TermsPage
