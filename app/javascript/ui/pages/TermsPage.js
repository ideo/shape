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
import LoggedOutBasicHeader from '~/ui/layout/LoggedOutBasicHeader'
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

const StyledSeal = styled.div`
  height: 80px;
  width: 57.98px;
  float: 'none';
  position: relative;
  background-image: url(${props => props.assetUrl});
  background-position: 'left';
  background-repeat: no-repeat;
  background-size: contain;
  margin-bottom: 10px;
`

class TermsPage extends React.PureComponent {
  render() {
    let inner
    inner = (
      <div>
        <StyledMarkdown source={termsMarkdown} />
      </div>
    )
    if (this.props.location.pathname !== '/terms') {
      const organization = apiStore.currentUserOrganization
      const quillProps = {
        readOnly: true,
        theme: null,
      }
      const textData = organization.terms_text_item.toJSON().data_content
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
        {!loggedIn && <LoggedOutBasicHeader />}
        <PageContainer>
          <Heading1>Terms and Privacy</Heading1>
          {loggedIn && <OverdueBanner />}
          <StyledTitle>Shape Terms of Use</StyledTitle>
          <StyledLink href="https://www.ideo.com/privacy" target="_blank">
            Privacy Policy
          </StyledLink>
          <StyledSeal
            assetUrl={
              'https://ideo-sso.s3-us-west-2.amazonaws.com/assets/privacy_certified_globe.png'
            }
          />
          {inner}
          <StyledSeal
            assetUrl={
              'https://ideo-sso.s3-us-west-2.amazonaws.com/assets/privacy_certified_globe.png'
            }
          />
        </PageContainer>
      </div>
    )
  }
}

export default TermsPage
