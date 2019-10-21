import _ from 'lodash'
import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import PropTypes from 'prop-types'
import { Element as ScrollElement } from 'react-scroll'
import { Box } from 'reflexbox'
import {
  MarketingBack,
  MarketingFlex,
  MarketingStandaloneVideoWrapper,
  MarketingH1Bold,
} from '~/ui/global/styled/marketing.js'
import { DisplayText } from '~/ui/global/styled/typography'
import MarketingMenu from '~/ui/marketing/MarketingMenu'
import ContentBlock from '~/ui/marketing/ContentBlock'
import Stats from '~/ui/marketing/Stats'
import { Pricing } from '~/ui/marketing/Pricing'
import marketingFirebaseClient from '~/vendor/firebase/clients/marketingFirebaseClient'
import ReactPlayer from 'react-player'
import PageFooter from '~/ui/marketing/PageFooter.js'

import styled from 'styled-components'

const Subtitle = styled(DisplayText)`
  font-size: 18px;
  line-height: 25px;
  text-align: center;
`

class MarketingProductPage extends React.Component {
  constructor(props) {
    super(props)
    this.page = props.match.params.page
    this.state = {
      content: {},
      footer: {},
    }
  }

  async componentDidMount() {
    const content = await marketingFirebaseClient.getCollectionField(
      'product',
      this.page
    )
    this.setState({ content: content })
    const footer = await marketingFirebaseClient.getCollectionField(
      'home',
      'footer'
    )
    this.setState({ footer: footer })
  }

  get renderVideoPlayer() {
    const {
      content: { hero },
    } = this.state
    if (!hero || !hero.videoUrl) return ''
    return (
      <Fragment>
        <MarketingFlex align="center" justify="center" wrap w={1}>
          <Box mt={44}>
            <MarketingStandaloneVideoWrapper>
              <ReactPlayer
                url={hero.videoUrl}
                height="100%"
                width="100%"
                playing={false}
              />
            </MarketingStandaloneVideoWrapper>
          </Box>
        </MarketingFlex>
        <MarketingFlex align="center" justify="center" wrap w={1}>
          <Box w={[590, 0.6, 0.32]} mt={44} pr={[3, 0, 0]} pl={[3, 0, 0]}>
            <Subtitle>{hero.videoCaption}</Subtitle>
          </Box>
        </MarketingFlex>
      </Fragment>
    )
  }

  get sortedBlocks() {
    const {
      content: { blocks },
    } = this.state
    return _.sortBy(blocks, block => block.order)
  }

  render() {
    const { location } = this.props
    const { content, footer } = this.state
    if (!content) return <div />
    const { hero } = content

    return (
      <Fragment>
        <MarketingBack>
          <MarketingMenu location={location} />
          {this.page === 'pricing' && content.blocks && (
            <Pricing pageName={this.page} {...content.blocks[0]} />
          )}
          {this.page !== 'pricing' && (
            <Fragment>
              <MarketingFlex column align="center" justify="center" wrap w={1}>
                <Box w={590} mt={34} pr={[3, 0, 0]} pl={[3, 0, 0]}>
                  <MarketingH1Bold>{hero && hero.title}</MarketingH1Bold>
                </Box>
                <Box w={[1, 0.6, 590]} mt={44} pr={[3, 0, 0]} pl={[3, 0, 0]}>
                  <Subtitle>{hero && hero.subTitle}</Subtitle>
                </Box>
              </MarketingFlex>
              {this.renderVideoPlayer}
              <MarketingFlex align="center" justify="center" wrap w={1}>
                <Box w={1} justify="center">
                  <ScrollElement name="ContentAnchor" />
                  {this.sortedBlocks.map((block, i) => (
                    <ContentBlock
                      order={i + 1}
                      title={block.title}
                      content={block.content}
                      imageUrl={block.imageUrl}
                      imageShadow={block.imageShadow}
                    />
                  ))}
                </Box>
                {content.stats && (
                  <Stats
                    title={content.stats.title}
                    subtext=""
                    banner_image={null}
                    banner_images={content.stats.banner_images}
                    stats={content.stats.stats}
                  />
                )}
                {content.pricing && (
                  <Pricing pageName={this.page} {...content.pricing} />
                )}
              </MarketingFlex>
            </Fragment>
          )}
        </MarketingBack>
        <PageFooter content={footer} />
      </Fragment>
    )
  }
}

MarketingProductPage.propTypes = {
  match: PropTypes.object.isRequired,
  location: ReactRouterPropTypes.location.isRequired,
}

export default MarketingProductPage
