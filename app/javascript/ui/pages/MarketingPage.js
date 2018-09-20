import { Fragment } from 'react'
import { Box } from 'reflexbox'
import { Element as ScrollElement } from 'react-scroll'

import {
  MarketingBack,
  MarketingFooter,
  MarketingHeavyCTA,
  InvertMarketingLink,
  InvertMarketingH1,
  InvertMarketingH1Bold,
  InvertMarketingLinkMail,
  MarketingFlex,
  ResponsiveInlineBlock,
  ResponsivePadInlineBlock,
  DesktopSpacer,
  Center,
  MarketingTagLine,
  // MarketingVideoLink,
  MarketingShapeLogo,
  MarketingBetaSticker,
  MarketingCallToAction,
  MarketingGradientTop,
  InvertedCentered,
  InvertedFixedWidth,
} from '~/ui/global/styled/marketing.js'
import poweredByIdeo from '~/assets/Powered-by-IDEO-Inverted.png'
import MarketingMenu from '~/ui/marketing/MarketingMenu.js'
import SubscribeEmail from '~/ui/marketing/SubscribeEmail.js'
import ProductDescriptions from '~/ui/marketing/ProductDescriptions.js'
import firebase from '~/vendor/firebaseMarketing.js'

class MarketingPage extends React.Component {
  constructor(props) {
    super(props)
    const pageText = {}

    this.state = {
      pageTexts: pageText,
    }
  }

  componentDidMount() {
    const textValues = {}
    let db = {}
    db = firebase.firestore()

    db.collection('pageText')
      .get()
      .then(snapshot => {
        snapshot.forEach(pageText => {
          const key = pageText.id
          const { value } = pageText.data()
          textValues[key] = value
        })
        this.setState({ pageTexts: textValues })
      })
  }

  render() {
    return (
      <Fragment>
        <MarketingBack>
          <MarketingGradientTop>
            <ScrollElement name="TopAnchor" />
            <MarketingMenu />
            <MarketingBetaSticker />

            <Center>
              <MarketingShapeLogo data-cy="MarketingShapeLogo" />
              <MarketingTagLine>
                {this.state.pageTexts.tagLine}
              </MarketingTagLine>
            </Center>

            <Center>
              <ResponsiveInlineBlock>
                <a href="/login">
                  <MarketingCallToAction>
                    {this.state.pageTexts.buttonTopLeft}
                  </MarketingCallToAction>
                </a>
              </ResponsiveInlineBlock>
            </Center>
            {/*  -- VIDEO BUTTON DISABLED -- not ready yet
            <Center>
              <ResponsiveInlineBlock>
                <a href="/login">
                  <MarketingVideoLink>{this.state.pageTexts.buttonTopRight}</MarketingVideoLink>
                </a>
              </ResponsiveInlineBlock>
            </Center> */}
          </MarketingGradientTop>

          <MarketingFlex align="center" justify="center" wrap w={1}>
            <Box w={1} justify="center">
              <ScrollElement name="ContentAnchor" />
              <ProductDescriptions />
            </Box>
          </MarketingFlex>
        </MarketingBack>

        <MarketingFooter>
          <ScrollElement name="FooterAnchor" />
          <MarketingFlex align="center" justify="center" wrap w={1}>
            <Box w={1}>
              <InvertMarketingH1Bold>
                {this.state.pageTexts.footerHeader}
              </InvertMarketingH1Bold>
            </Box>
            <Box w={1}>
              <InvertMarketingH1>
                {this.state.pageTexts.footerSubHeader}
              </InvertMarketingH1>
            </Box>
            <Box w={1} py={32}>
              <a href="/login">
                <MarketingHeavyCTA href="/login">
                  {this.state.pageTexts.buttonFooter}
                </MarketingHeavyCTA>
              </a>
            </Box>

            <ResponsivePadInlineBlock>
              <InvertedCentered>
                {this.state.pageTexts.contactHeader}
              </InvertedCentered>
            </ResponsivePadInlineBlock>
            <ResponsivePadInlineBlock>
              <InvertedCentered>
                {this.state.pageTexts.contactHeader2}
              </InvertedCentered>
            </ResponsivePadInlineBlock>

            <Box w={1}>
              <InvertMarketingLinkMail href="mailto:hello@shape.space">
                hello@shape.space
              </InvertMarketingLinkMail>
            </Box>

            <Box w={1} wrap>
              <InvertedFixedWidth>
                {this.state.pageTexts.subscriptionHeader}
              </InvertedFixedWidth>
            </Box>

            <Box w={1}>
              <SubscribeEmail />
            </Box>

            <Box w={1}>
              <InvertMarketingLink
                href="https://www.ideo.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <img
                  src={poweredByIdeo}
                  alt="Powered by IDEO"
                  style={{
                    width: '95px',
                    paddingTop: '55px',
                    paddingBottom: '30px',
                  }}
                />
              </InvertMarketingLink>
            </Box>
          </MarketingFlex>

          <Center>
            <ResponsivePadInlineBlock>
              <InvertMarketingLink href="https://www.ideo.com/privacy">
                Privacy and Cookie Policy
              </InvertMarketingLink>
            </ResponsivePadInlineBlock>
          </Center>
          <Center>
            <ResponsivePadInlineBlock>
              <DesktopSpacer style={{ width: '80px' }} />
              <InvertMarketingLink href="https://www.ideo.com/">
                {/* https://github.com/evcohen/eslint-plugin-jsx-a11y/issues/388 */}
                &copy; 2018
              </InvertMarketingLink>
            </ResponsivePadInlineBlock>
          </Center>
        </MarketingFooter>
      </Fragment>
    )
  }
}

export default MarketingPage
