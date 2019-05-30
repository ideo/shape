import _ from 'lodash'
import { Fragment } from 'react'
import { Box } from 'reflexbox'
import { Element as ScrollElement } from 'react-scroll'
import ReactRouterPropTypes from 'react-router-prop-types'
import {
  MarketingBack,
  MarketingFlex,
  MarketingHeroButtonContainer,
  Center,
  MarketingTagLine,
  MarketingVideoLink,
  MarketingShapeLogo,
  MarketingVideoWrapper,
  MarketingCallToAction,
  MarketingGradientTop,
  VideoDimensions,
} from '~/ui/global/styled/marketing.js'
import MarketingMenu from '~/ui/marketing/MarketingMenu'
import ContentBlock from '~/ui/marketing/ContentBlock'
import BetaSticker from '~/ui/marketing/BetaSticker'
import marketingFirebaseClient from '~/vendor/firebase/clients/marketingFirebaseClient'
import ReactPlayer from 'react-player'
import PageFooter from '~/ui/marketing/PageFooter.js'
import { hasKeyValueParam } from '~/utils/paramUtils.js'

class MarketingPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      content: {},
      videoPlaying: false,
    }
    this.toggleVideoPlaying = this.toggleVideoPlaying.bind(this)
  }

  async componentDidMount() {
    const content = await marketingFirebaseClient.getCollection('home')
    this.setState({ content: content })

    const paramString = this.props.location.search
    if (hasKeyValueParam(paramString, 'campaign', 'alphapt7')) {
      content.footer.header =
        content.footer.header && content.footer.header.replace('$5', '$7')
    }
    if (hasKeyValueParam(paramString, 'videoPlaying', 'true')) {
      this.setState({ videoPlaying: true })
    }
  }

  toggleVideoPlaying = () => {
    this.setState({
      videoPlaying: !this.state.videoPlaying,
    })
  }

  get sortedBlocks() {
    const {
      content: { blocks },
    } = this.state
    return _.sortBy(blocks, block => block.order)
  }

  render() {
    const { videoPlaying, content } = this.state
    const { hero } = content
    const videoPlayingButtonText = !videoPlaying
      ? hero && hero.buttons[1]
      : hero && hero.buttons[2]
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
                {hero && hero.tagLine}
              </MarketingTagLine>
            </Center>

            <MarketingFlex align="center" justify="center" wrap w={1}>
              <MarketingVideoWrapper videoPlaying={videoPlaying}>
                <ReactPlayer
                  url={hero && hero.videoUrl}
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
                    {hero && hero.buttons[0]}
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
              {this.sortedBlocks.map(block => (
                <ContentBlock
                  order={block.order}
                  title={block.title}
                  content={block.content}
                  imageUrl={block.imageUrl}
                />
              ))}
            </Box>
          </MarketingFlex>
        </MarketingBack>

        <PageFooter
          footerHeader={content.footer && content.footer.header}
          footerSubheader={content.footer && content.footer.subHeader}
          footerButtons={content.footer && content.footer.buttons}
          contactHeader={content.contact && content.contact.header}
          contactHeader2={content.contact && content.contact.header2}
          subscriptionHeader={
            content.subscription && content.subscription.header
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
