import _ from 'lodash'
import ReactMarkdown from 'react-markdown'
import ReactQuill from 'react-quill'
import styled from 'styled-components'
import { scroller, Element as ScrollElement } from 'react-scroll'

import { apiStore } from '~/stores'
import {
  Heading1,
  DisplayText,
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

const TableOfContents = styled.ol`
  margin-bottom: 1em;
  li {
    margin-bottom: 0.33rem;
  }
  button {
    color: #06c;
    text-decoration: underline;
  }
`

const StyledTitle = styled(DisplayText)`
  font-weight: ${v.weights.medium};
  text-transform: uppercase;
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
  cursor: pointer;
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
      '1. Definitions': '1--definitions',
      '2. Accounts and Registration': '2--accounts-and-registration',
      '3. Payment': '3--payment',
      '4. Terminating your account: Initial Access Period and Ongoing Access Period':
        '4--terminating-your-account--initial-access-period-and-ongoing-access-period',
      '5. Modification of TOU': '5--modification-of-tou',
      '6. Eligibility': '6--eligibility',
      '7. User Content': '7--user-content',
      '8. Grant and Restrictions on Use': '8--grant-and-restrictions-on-use',
      '9. Communications with the Site Administrator':
        '9--communications-with-the-site-administrator',
      '10. Acceptable Use Policy': '10--acceptable-use-policy',
      '11. Trademark Information': '11--trademark-information',
      '12. Third Party Sites, Services and/or Resources':
        '12--third-party-sites--services-and-or-resources',
      '13. Disclaimer': '13--disclaimer',
      '14. Liability': '14--liability',
      '15. Governing Law and Jurisdiction':
        '15--governing-law-and-jurisdiction',
      '16. General Provisions': '16--general-provisions',
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
        <TableOfContents>
          <p>
            <strong>Table of Contents</strong>
          </p>
          {this.tableOfContents}
        </TableOfContents>
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
      const textData = organization.terms_text_item.toJSON().quill_data
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
          <Heading1>IDEO Products Terms of Use</Heading1>
          {loggedIn && <OverdueBanner />}
          {inner}
          <StyledSeal
            assetUrl={
              'https://ideo-sso.s3-us-west-2.amazonaws.com/assets/privacy_certified_globe.png'
            }
            onClick={() => {
              window.location.href =
                'http://www.esrb.org/confirm/ideo-confirmation.aspx'
            }}
          />
        </PageContainer>
      </div>
    )
  }
}

export default TermsPage
