import { Fragment } from 'react'
import { Element as ScrollElement } from 'react-scroll'
import { Box } from 'reflexbox'
import {
  MarketingBack,
  MarketingProductPageHeroTitle,
  MarketingProductPageHeroSubtitle,
  MarketingProductPageHeroVideoCaption,
  MarketingFlex,
  MarketingStandaloneVideoWrapper,
  VideoDimensions,
} from '~/ui/global/styled/marketing.js'
import MarketingMenu from '~/ui/marketing/MarketingMenu'
import ProductTemplates from '~/ui/marketing/ProductTemplates'
import marketingFirebaseClient from '~/vendor/firebase/clients/marketingFirebaseClient'
import ReactPlayer from 'react-player'
import PageFooter from '~/ui/marketing/PageFooter.js'

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
        <PageFooter
          footerHeader={pageTexts.footer && pageTexts.footer.header}
          footerSubheader={pageTexts.footer && pageTexts.footer.subHeader}
          footerButtons={pageTexts.footer && pageTexts.footer.buttons}
          contactHeader={pageTexts.contact && pageTexts.contact.header}
          contactHeader2={pageTexts.contact && pageTexts.contact.header2}
          subscriptionHeader={
            pageTexts.subscription && pageTexts.subscription.header
          }
        />
      </Fragment>
    )
  }
}

export default ProductTemplatesPage
