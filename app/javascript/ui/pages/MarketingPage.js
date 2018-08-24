import { Fragment } from 'react'
import { Box } from 'reflexbox'

import { MarketingBack,
  MarketingGradientTop,
  MarketingFooter,
  MarketingTagLine,
  MarketingHeavyCTA,
  MarketingVideoLink,
  MarketingShapeLogo,
  MarketingBetaSticker,
  MarketingCallToAction,
  InvertMarketingLink,
  InvertMarketingContent,
  InvertMarketingH1,
  InvertMarketingH2,
  InvertMarketingLinkMail,
  MarketingFlex,
} from '~/ui/global/styled/marketing.js'
import poweredByIdeo from '~/assets/Powered-by-IDEO-Inverted.png'
import MarketingMenu from '~/ui/pages/SubComponents/MarketingMenu.js'
import SubscribeEmail from '~/ui/pages/SubComponents/SubscribeEmail.js'
import ProductDescriptions from '~/ui/pages/SubComponents/ProductDescriptions.js'

class MarketingPage extends React.PureComponent {
  render() {
    return (
      <Fragment>
        <MarketingBack>
          <MarketingGradientTop>
            <MarketingMenu />
            <MarketingBetaSticker />

            <MarketingFlex
              align="center"
              justify="center"
              column
              w={1}
            >
              <Box w={[null, 1 / 5]} />
              <Box w={[1, 3 / 5]} >
                <MarketingShapeLogo />
              </Box>
              <Box w={[null, 1 / 5]} />

              <Box w={[null, 1 / 5]} />
              <Box w={[1, 3 / 5]} wrap>
                <MarketingTagLine>
                  A visual, collaborative space to build, test, and refine your ideas
                </MarketingTagLine>
              </Box>
              <Box w={[null, 1 / 5]} />
            </MarketingFlex>

            <MarketingFlex
              align="center"
              justify="center"
              wrap
              w={1}
            >
              <Box w={[null, 1 / 6]} auto />
              <Box w={[1, 2 / 6]} auto>
                <a href="https://profile.ideo.com/">
                  <MarketingCallToAction>Get Early Access</MarketingCallToAction>
                </a>
              </Box>
              <Box w={[1, 2 / 6]} auto>
                <a href="https://profile.ideo.com/">
                  <MarketingVideoLink>Watch the Video</MarketingVideoLink>
                </a>
              </Box>
              <Box w={[null, 1 / 6]} auto />
            </MarketingFlex>
          </MarketingGradientTop>

          <MarketingFlex
            align="center"
            justify="center"
            wrap
            w={1}
          >
            <Box w={1} justify="center" >
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
                <img src={poweredByIdeo} alt="Powered by IDEO" />
              </InvertMarketingLink>
            </Box>

            <Box w={1 / 2} >
              <section align="right"><InvertMarketingLink href="https://www.ideo.com/privacy">
                Privacy and Cookie Policy</InvertMarketingLink></section>
            </Box>
            <Box w={1 / 8} />
            <Box w={3 / 8}><section align="left">&copy; 2018</section></Box>

          </MarketingFlex>
        </MarketingFooter>
      </Fragment>
    )
  }
}

export default MarketingPage
