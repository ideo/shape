import { Fragment } from 'react'
import { Element as ScrollElement } from 'react-scroll'
import { Box } from 'reflexbox'
import {
  MarketingBack,
  MarketingFooter,
  InvertMarketingLink,
  InvertMarketingH1,
  InvertMarketingH1Bold,
  MarketingProductPageHeroTitle,
  MarketingProductPageHeroSubtitle,
  MarketingProductPageHeroVideoCaption,
  InvertMarketingLinkMail,
  MarketingFlex,
  MarketingStandaloneVideoWrapper,
  MarketingCallToAction,
  ResponsivePadInlineBlock,
  DesktopSpacer,
  Center,
  InvertedCentered,
  InvertedFixedWidth,
  VideoDimensions,
} from '~/ui/global/styled/marketing.js'
import poweredByIdeo from '~/assets/Powered-by-IDEO-Inverted.png'
import MarketingMenu from '~/ui/marketing/MarketingMenu'
import SubscribeEmail from '~/ui/marketing/SubscribeEmail'
import ProductTemplates from '~/ui/marketing/ProductTemplates'
import marketingFirebaseClient from '~/vendor/firebase/clients/marketingFirebaseClient'
import ReactPlayer from 'react-player'

class ProductTemplatesPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      pageTexts: {},
    }
  }

  componentDidMount() {
    marketingFirebaseClient
      .getObjectFromCollection('/product/pages/templates') // query subcollection
      .then(texts => {
        this.setState({ pageTexts: texts })
      })
  }

  render() {
    const { pageTexts } = this.state
    return (
      <Fragment>
        <MarketingBack>
          <MarketingMenu />
          <MarketingFlex align="center" justify="center" wrap w={1}>
            <Box w={1} mt={[12, 28, 34]} pr={[3, 0, 0]} pl={[3, 0, 0]}>
              <MarketingProductPageHeroTitle>
                {pageTexts.hero && pageTexts.hero.title}
              </MarketingProductPageHeroTitle>
            </Box>
            <Box
              w={[1, 0.6, 0.32]}
              mt={[12, 28, 34]}
              pr={[3, 0, 0]}
              pl={[3, 0, 0]}
            >
              <MarketingProductPageHeroSubtitle>
                {pageTexts.hero && pageTexts.hero.subTitle}
              </MarketingProductPageHeroSubtitle>
            </Box>
          </MarketingFlex>
          <MarketingFlex align="center" justify="center" wrap w={1}>
            <Box mt={[12, 28, 34]}>
              <MarketingStandaloneVideoWrapper>
                <ReactPlayer
                  url={pageTexts.hero && pageTexts.hero.videoUrl}
                  height={VideoDimensions.height}
                  width={VideoDimensions.width}
                  playing={false}
                />
              </MarketingStandaloneVideoWrapper>
            </Box>
          </MarketingFlex>
          <MarketingFlex align="center" justify="center" wrap w={1}>
            <Box
              w={[1, 0.6, 0.32]}
              mt={[8, 28, 34]}
              pr={[3, 0, 0]}
              pl={[3, 0, 0]}
            >
              <MarketingProductPageHeroVideoCaption>
                {pageTexts.hero && pageTexts.hero.videoCaption}
              </MarketingProductPageHeroVideoCaption>
            </Box>
          </MarketingFlex>

          <MarketingFlex align="center" justify="center" wrap w={1}>
            <Box w={1} justify="center">
              <ScrollElement name="ContentAnchor" />
              <ProductTemplates />
            </Box>
          </MarketingFlex>
        </MarketingBack>

        <MarketingFooter>
          <ScrollElement name="FooterAnchor" />
          <MarketingFlex align="center" justify="center" wrap w={1}>
            <Box w={1} mb={[10, '4px']}>
              <InvertMarketingH1Bold>
                {pageTexts.footer && pageTexts.footer.header}
              </InvertMarketingH1Bold>
            </Box>
            <Box w={1}>
              <InvertMarketingH1>
                {pageTexts.footer && pageTexts.footer.subHeader}
              </InvertMarketingH1>
            </Box>
            <Box w={1} pt={[46, 65]} pb={[46, 74]} mb={[10, 0]}>
              <a className="get-early-access-footer" href="/sign_up">
                <MarketingCallToAction>
                  {pageTexts.footer && pageTexts.footer.buttons[0]}
                </MarketingCallToAction>
              </a>
            </Box>

            <ResponsivePadInlineBlock>
              <InvertedCentered>
                {pageTexts.contact && pageTexts.contact.header}
              </InvertedCentered>
            </ResponsivePadInlineBlock>
            <ResponsivePadInlineBlock>
              <InvertedCentered>
                {pageTexts.contact && pageTexts.contact.header2}
              </InvertedCentered>
            </ResponsivePadInlineBlock>

            <Box w={1}>
              <InvertMarketingLinkMail href="mailto:hello@shape.space">
                hello@shape.space
              </InvertMarketingLinkMail>
            </Box>

            <Box w={1} mt={(0, 5)} wrap>
              <InvertedFixedWidth>
                {pageTexts.subscription && pageTexts.subscription.header}
              </InvertedFixedWidth>
            </Box>

            <Box w={1} mt={[8, 0]}>
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
                {/* Added span around &copy; in order to satisfy "jsx-a11y/accessible-emoji" */}
                <span role="img" aria-label="Copyright Symbol">
                  &copy;
                </span>{' '}
                2018
              </InvertMarketingLink>
            </ResponsivePadInlineBlock>
          </Center>
        </MarketingFooter>
      </Fragment>
    )
  }
}

export default ProductTemplatesPage
