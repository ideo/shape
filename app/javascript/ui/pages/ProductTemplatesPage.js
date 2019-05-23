import { Fragment } from 'react'
import { Element as ScrollElement } from 'react-scroll'
import { Box } from 'reflexbox'
import {
  MarketingBack,
  MarketingFooter,
  InvertMarketingLink,
  InvertMarketingH1,
  InvertMarketingH1Bold,
  InvertMarketingLinkMail,
  MarketingFlex,
  ResponsiveInlineBlock,
  ResponsivePadInlineBlock,
  DesktopSpacer,
  Center,
  MarketingCallToAction,
  MarketingGradientTop,
  InvertedCentered,
  InvertedFixedWidth,
} from '~/ui/global/styled/marketing.js'
import poweredByIdeo from '~/assets/Powered-by-IDEO-Inverted.png'
import MarketingMenu from '~/ui/marketing/MarketingMenu'
import SubscribeEmail from '~/ui/marketing/SubscribeEmail'
import ProductTemplates from '~/ui/marketing/ProductTemplates'
import marketingFirestoreClient from '~/vendor/firebase/sites/marketing'

class ProductTemplatesPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      pageTexts: {},
    }
  }

  componentDidMount() {
    marketingFirestoreClient
      .getObjectFromCollection('/product/pages/feedback')
      .then(texts => {
        this.setState({ pageTexts: texts })
      })
  }

  render() {
    return (
      <Fragment>
        <MarketingBack>
          <MarketingGradientTop>
            <ScrollElement name="TopAnchor" />
            <MarketingMenu />
            <Center>
              <ResponsiveInlineBlock>
                <a className="get-early-access-header" href="/sign_up">
                  <MarketingCallToAction />
                </a>
              </ResponsiveInlineBlock>
            </Center>
            {/*  -- VIDEO BUTTON DISABLED -- not ready yet
            <Center>
              <ResponsiveInlineBlock>
                <a href="/sign_up">
                  <MarketingVideoLink>{this.state.pageTexts.buttonTopRight}</MarketingVideoLink>
                </a>
              </ResponsiveInlineBlock>
            </Center> */}
          </MarketingGradientTop>

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
              <InvertMarketingH1Bold />
            </Box>
            <Box w={1}>
              <InvertMarketingH1 />
            </Box>
            <Box w={1} pt={[46, 65]} pb={[46, 74]} mb={[10, 0]}>
              <a className="get-early-access-footer" href="/sign_up">
                <MarketingCallToAction />
              </a>
            </Box>

            <ResponsivePadInlineBlock>
              <InvertedCentered />
            </ResponsivePadInlineBlock>
            <ResponsivePadInlineBlock>
              <InvertedCentered />
            </ResponsivePadInlineBlock>

            <Box w={1}>
              <InvertMarketingLinkMail href="mailto:hello@shape.space">
                hello@shape.space
              </InvertMarketingLinkMail>
            </Box>

            <Box w={1} mt={(0, 5)} wrap>
              <InvertedFixedWidth />
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
