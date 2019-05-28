import { Fragment } from 'react'
import { Box } from 'reflexbox'
import { Element as ScrollElement } from 'react-scroll'
import ReactRouterPropTypes from 'react-router-prop-types'
import {
  MarketingBack,
  // MarketingHeavyCTA,
  MarketingFlex,
  MarketingHeroButtonContainer,
  Center,
  MarketingTagLine,
  MarketingVideoLink,
  MarketingShapeLogo,
  MarketingVideoWrapper,
  // MarketingBetaSticker,
  MarketingCallToAction,
  MarketingGradientTop,
  VideoDimensions,
} from '~/ui/global/styled/marketing.js'
import MarketingMenu from '~/ui/marketing/MarketingMenu'
import ProductDescriptions from '~/ui/marketing/ProductDescriptions'
import BetaSticker from '~/ui/marketing/BetaSticker'
import marketingFirebaseClient from '~/vendor/firebase/clients/marketingFirebaseClient'
import ReactPlayer from 'react-player'
import PageFooter from '~/ui/marketing/PageFooter.js'
import { hasKeyValueParam } from '~/utils/paramUtils.js'

class MarketingPage extends React.Component {
  constructor(props) {
    super(props)
    const pageTexts = {}

    this.state = {
      pageTexts: pageTexts,
      videoPlaying: false,
    }

    this.toggleVideoPlaying = this.toggleVideoPlaying.bind(this)
  }

  componentDidMount() {
    marketingFirebaseClient.getObjectFromCollection('home').then(texts => {
      const paramString = this.props.location.search
      if (hasKeyValueParam(paramString, 'campaign', 'alphapt7')) {
        texts.footer.header =
          texts.footer.header && texts.footer.header.replace('$5', '$7')
      }
      if (hasKeyValueParam(paramString, 'videoPlaying', 'true')) {
        this.setState({ videoPlaying: true })
      }
      this.setState({ pageTexts: texts })
    })
  }

  toggleVideoPlaying = () => {
    this.setState({
      videoPlaying: !this.state.videoPlaying,
    })
  }

  render() {
    const { videoPlaying, pageTexts } = this.state
    const videoPlayingButtonText = !videoPlaying
      ? pageTexts.hero && pageTexts.hero.buttons[1]
      : pageTexts.hero && pageTexts.hero.buttons[2]
    return (
      <Fragment>
        <MarketingBack>
          <MarketingGradientTop>
            <ScrollElement name="TopAnchor" />
            <MarketingMenu />
            <BetaSticker />

            <Center>
              <MarketingShapeLogo videoPlaying={videoPlaying} />
              <MarketingTagLine videoPlaying={videoPlaying}>
                {pageTexts.hero && pageTexts.hero.tagLine}
              </MarketingTagLine>
            </Center>

            <MarketingFlex align="center" justify="center" wrap w={1}>
              <MarketingVideoWrapper videoPlaying={videoPlaying}>
                <ReactPlayer
                  url={pageTexts.hero && pageTexts.hero.videoUrl}
                  height={videoPlaying ? VideoDimensions.height : '0px'}
                  width={videoPlaying ? VideoDimensions.width : '0px'}
                  playing={videoPlaying}
                />
              </MarketingVideoWrapper>
            </MarketingFlex>

            <Center>
              <MarketingHeroButtonContainer>
                <a className="get-early-access-header" href="/sign_up">
                  <MarketingCallToAction>
                    {pageTexts.hero && pageTexts.hero.buttons[0]}
                  </MarketingCallToAction>
                </a>
                <MarketingVideoLink onClick={this.toggleVideoPlaying}>
                  {videoPlayingButtonText}
                </MarketingVideoLink>
              </MarketingHeroButtonContainer>
            </Center>
          </MarketingGradientTop>

          <MarketingFlex align="center" justify="center" wrap w={1}>
            <Box w={1} justify="center">
              <ScrollElement name="ContentAnchor" />
              <ProductDescriptions />
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

MarketingPage.propTypes = {
  location: ReactRouterPropTypes.location.isRequired,
}
export default MarketingPage
