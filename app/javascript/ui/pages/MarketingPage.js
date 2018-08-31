import { Fragment } from 'react'
import { Box } from 'reflexbox'

import { MarketingBack,
  MarketingFooter,
  MarketingHeavyCTA,
  InvertMarketingLink,
  InvertMarketingContent,
  InvertMarketingH1,
  InvertMarketingH2,
  InvertMarketingLinkMail,
  MarketingFlex,
  ResponsiveInlineBlock,
  ResponsivePadInlineBlock,
  DesktopSpacer,
  Center,
  MarketingTagLine,
  MarketingVideoLink,
  MarketingShapeLogo,
  MarketingBetaSticker,
  MarketingCallToAction,
  MarketingGradientTop,
} from '~/ui/global/styled/marketing.js'
import poweredByIdeo from '~/assets/Powered-by-IDEO-Inverted.png'
import MarketingMenu from '~/ui/pages/SubComponents/MarketingMenu.js'
import SubscribeEmail from '~/ui/pages/SubComponents/SubscribeEmail.js'
import ProductDescriptions from '~/ui/pages/SubComponents/ProductDescriptions.js'
import { Element as ScrollElement } from 'react-scroll'
import VisibilitySensor from 'react-visibility-sensor'

class MarketingPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = { isLogoVisible: true }
  }

  handleLogoVisibility = (isVisible) => {
    this.setState({ isLogoVisible: isVisible })
  }

  render() {
    return (
      <Fragment>
        <MarketingBack>
          <MarketingGradientTop>
            <ScrollElement name="TopAnchor" />
            <MarketingMenu isBigLogoVisible={this.state.isLogoVisible} />
            <MarketingBetaSticker />

            <Center>
              <VisibilitySensor
                partialVisibility
                scrollCheck
                intervalDelay={300}
                onChange={this.handleLogoVisibility}
              >
                <MarketingShapeLogo />
              </VisibilitySensor>
                <MarketingTagLine>
-                  A visual, collaborative space to build, test, and refine your ideas
-                </MarketingTagLine>
            </Center>

            <Center>
              <ResponsiveInlineBlock>
                <a href="https://profile.ideo.com/">
                  <MarketingCallToAction>Get Early Access</MarketingCallToAction>
                </a>
              </ResponsiveInlineBlock>
            </Center>
            <Center>
              <ResponsiveInlineBlock>
                <a href="https://profile.ideo.com/">
                  <MarketingVideoLink>Watch the Video</MarketingVideoLink>
                </a>
              </ResponsiveInlineBlock>
            </Center>
          </MarketingGradientTop>

          <MarketingFlex
            align="center"
            justify="center"
            wrap
            w={1}
          >
            <Box w={1} justify="center" >
              <ScrollElement name="ContentAnchor" />
              <ProductDescriptions />
            </Box>
          </MarketingFlex>
        </MarketingBack>

        <MarketingFooter>
          <MarketingFlex
            align="center"
            justify="center"
            wrap
            w={1}
          >
            <Box w={1}>
              <InvertMarketingH1>
                Access is just $5 / month per person.
              </InvertMarketingH1>
            </Box>
            <Box w={1}>
              <InvertMarketingH2>
                The first month is on us.
              </InvertMarketingH2>
            </Box>

            <ScrollElement name="FooterAnchor" />
            <Box w={1} py={32}>
              <a href="https://profile.ideo.com/">
                <MarketingHeavyCTA href="https://profile.ideo.com">GET EARLY ACCESS</MarketingHeavyCTA>
              </a>
            </Box>

            <Box w={1} >
              <InvertMarketingContent>
                Curious to learn more? Drop us a line at:
              </InvertMarketingContent>
            </Box>

            <Box w={1}>
              <InvertMarketingLinkMail href="mailto:hello@shape.space">hello@shape.space</InvertMarketingLinkMail>
            </Box>

            <Box w={1} py={32} wrap>
              <InvertMarketingContent>Stay current on new features and case studies by
                signing up for our mailing list:</InvertMarketingContent>
            </Box>

            <Box w={1}>
              <SubscribeEmail />
            </Box>

            <Box w={1} py={16}>
              <InvertMarketingLink href="https://www.ideo.com/" rel="noopener noreferrer" target="_blank">
                <img src={poweredByIdeo} 
                alt="Powered by IDEO" 
                style={{width:'95px', paddingTop:'68px', paddingBottom:'40px'}} />
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
              <InvertMarketingContent>
                <DesktopSpacer style={{width:'80px'}}/>
                &copy; 2018
              </InvertMarketingContent>
            </ResponsivePadInlineBlock>
          </Center>

        </MarketingFooter>
      </Fragment>
    )
  }
}

export default MarketingPage
