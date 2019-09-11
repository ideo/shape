import _ from 'lodash'
import ReactMarkdown from 'react-markdown'
import ReactQuill from 'react-quill'
import styled from 'styled-components'
import { scroller, Element as ScrollElement } from 'react-scroll'

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
import { termsIntroMarkdown, termsMarkdown } from '~/markdown/TermsOfUse'
import OverdueBanner from '~/ui/layout/OverdueBanner'

const StyledMarkdown = styled(ReactMarkdown)`
  h2 {
    font-size: 1rem;
  }
`
StyledMarkdown.displayName = 'StyledMarkdown'

const StyledTitle = styled(DisplayText)`
  font-weight: ${v.weights.medium};
  text-transform: uppercase;
`

const StyledLink = styled(DisplayLink)`
  text-transform: uppercase;
  margin-left: 80px;
  margin-bottom: 30px;
  font-weight: ${v.weights.medium};
  display: inline-block;
`

const StyledSeal = styled.div`
  height: 80px;
  width: 57.98px;
  float: none;
  position: relative;
  background-image: url(${props => props.assetUrl});
  background-position: left;
  background-repeat: no-repeat;
  background-size: contain;
  margin-bottom: 10px;
`

// copied from https://github.com/rexxars/react-markdown/issues/69
function flatten(text, child) {
  return typeof child === 'string'
    ? text + child
    : React.Children.toArray(child.props.children).reduce(flatten, text)
}

function HeadingRenderer(opts) {
  const children = React.Children.toArray(opts.children)
  const text = children.reduce(flatten, '')
  const slug = text.toLowerCase().replace(/\W/g, '-')
  return React.createElement('h' + opts.level, { id: slug }, opts.children)
}

class TermsPage extends React.PureComponent {
  scrollToAnchor = anchor => () => {
    scroller.scrollTo(anchor, {
      duration: 1000,
      smooth: true,
      offset: -50,
    })
  }

  get tableOfContents() {
    const toc = {
      '2. Accounts and Registration': '2--accounts-and-registration',
    }
    const items = []
    _.each(toc, (anchor, title) => {
      items.push(
        <li key={anchor}>
          <button onClick={this.scrollToAnchor(anchor)}>{title}</button>
        </li>
      )
    })
    return items
  }

  render() {
    let inner
    inner = (
      <div>
        <ScrollElement name="top" />
        <StyledMarkdown
          source={termsIntroMarkdown}
          renderers={{ heading: HeadingRenderer }}
        />

        <ol>{this.tableOfContents}</ol>
        <StyledMarkdown
          source={termsMarkdown}
          renderers={{ heading: HeadingRenderer }}
        />
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
