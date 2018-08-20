import { Fragment } from 'react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import v from '~/utils/variables'
import { Heading1, Heading2, Anchor } from '~/ui/global/styled/typography'
import poweredByIdeo from '~/assets/Powered-by-IDEO-Inverted.png'
import MarketingMenu from '~/ui/pages/shared/MarketingMenu.js'
import SubscribeEmail from '~/ui/layout/SubscribeEmail.js'

// TODO: use reflexbox for flexbox

const Footer = styled.div`
  text-align: center;
  background: ${v.colors.activityLightBlue};
  font-family: ${v.fonts.sans};
  color: white;
  font-size: 1rem;
`

const MarketingBack = styled.div`
  text-align: center;
  box-sizing: content-box;
  width: 100%;
  border: none;
  overflow: auto;
  color: rgb(247, 247, 247);
  background: white;
  margin-left: 0px;
  margin-right: 0px;
`
// TODO: remove browser-prefixes
const GradientTop = MarketingBack.extend`
  background-repeat;
  background: -webkit-linear-gradient(-90deg, rgba(255,255,255,0.9) 0, rgba(255,255,255,1) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), rgba(255,255,255,1);

  background: -moz-linear-gradient(180deg, rgba(255,255,255,0.9) 0, rgba(255,255,255,1) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), rgba(255,255,255,1);

  background: linear-gradient(180deg, rgba(255,255,255,0.9) 0 rgba(255,255,255,1) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), rgba(255,255,255,1);

  background-position: 50% 50%, 43px 48px, 14px 24px, 49px 28px, 34px 36px, 36px 14px;

  -webkit-background-origin: padding-box;
  background-origin: padding-box;

  -webkit-background-clip: border-box;
  background-clip: border-box;

  -webkit-background-size: auto auto, 30px 40px, 40px 30px, 50px 40px, 30px 40px, 40px 30px;
  background-size: auto auto, 30px 40px, 40px 30px, 50px 40px, 30px 40px, 40px 30px;
`

const InvertHeading1 = Heading1.extend`
  color: white;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.bold};
  letter-spacing: 0px;
  white-space: normal;
`

const InvertHeading2 = Heading2.extend`
  color: white;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
  font-size: 1.5rem;
  letter-spacing: 0px;
  white-space: normal;
`
const TagLine = InvertHeading2.extend`
  color: black;
  font-family: ${v.fonts.serif};
  font-weight: ${v.weights.medium};
`

const ContentLink = styled.button`
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  color: black;
  margin: 1em;
  padding: 12px 12px;
  cursor: pointer;
  letter-spacing: 1.5px;

  &:hover {
    color: ${v.colors.gray};
  }
`

const CallToAction = ContentLink.extend`
  background-color: #fcf113;
  border-radius: 4px;
  border: 1px solid #fcf113;
`

const VideoLink = ContentLink.extend`
  border-radius: 4px;
  border: 2px solid black;
`
const HeavyCTA = CallToAction.extend`
  font-weight: ${v.weights.bold};
  font-family: ${v.fonts.sans};
`

const Content = styled.div`
  color: black;
  letter-spacing: -0.2px;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`
const InvertContent = Content.extend`
  color: white;
`
const Link = Anchor.extend`
    color: white;
    letter-spacing: -0.2px;
    font-size: 1rem;
    font-family: ${v.fonts.sans};
    font-weight: ${v.weights.book};
`
const InvertLink = Link.extend`
    color: white;
`

const InvertLinkMail = Anchor.extend`
    color: white;
    letter-spacing: -0.2px;
    font-size: 2.25rem;
    font-family: ${v.fonts.serif};
`

const BetaSticker = styled.img.attrs({
  src: 'https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fcommon%2Fbeta-stick-2.png?alt=media&token=72957149-16e5-4c70-aa80-3a5ac129fa34'
})`
  alt: 'In Beta!';
  max-width: 100%;
  float: right;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: 40%;
    height: 40%;
  }
`

const ShapeLogo = styled.img.attrs({
  src: 'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo.svg'
})`
  alt: 'Shape';
  width: 60%;
  max-width: 100%;
`

class MarketingPage extends React.PureComponent {
  render() {
    return (
      <Fragment>
        <MarketingBack>
          <GradientTop>
            <MarketingMenu />
            <BetaSticker />

            <Flex
              align="center"
              justify="center"
              column
              w={1}
            >
              <Box w={[null, 1 / 5]} />
              <Box w={[1, 3 / 5]} >
                <ShapeLogo />
              </Box>
              <Box w={[null, 1 / 5]} />

              <Box w={[null, 1 / 5]} />
              <Box w={[1, 3 / 5]} wrap>
                <TagLine>
                  A visual, collaborative space to build, test, and refine your ideas
                </TagLine>
              </Box>
              <Box w={[null, 1 / 5]} />
            </Flex>

            <Flex
              align="center"
              justify="center"
              wrap
              w={1}
            >
              <Box w={[null, 1 / 6]} auto />
              <Box w={[1, 2 / 6]} auto>
                <CallToAction href="https://profile.ideo.com">GET EARLY ACCESS</CallToAction>
              </Box>
              <Box w={[1, 2 / 6]} auto>
                <VideoLink>WATCH THE VIDEO</VideoLink>
              </Box>
              <Box w={[null, 1 / 6]} auto />
            </Flex>
          </GradientTop>

          <Flex
            align="center"
            justify="center"
            wrap
            w={1}
          >
            <Box w={1} justify="center" >
              <Content>Left Text Right Image</Content>
            </Box>
            <Box w={1} justify="center" >
              <Content>Right Text left Image</Content>
            </Box>
          </Flex>
        </MarketingBack>

        <Footer>
          <Flex
            align="center"
            justify="center"
            wrap
            w={1}
          >
            <Box w={1}>
              <InvertHeading1>Access is just $5 / month per person.</InvertHeading1>
            </Box>
            <Box w={1}>
              <InvertHeading2>The first month is on us.</InvertHeading2>
            </Box>

            <Box w={1} py={32}>
              <HeavyCTA href="https://profile.ideo.com">GET EARLY ACCESS</HeavyCTA>
            </Box>

            <Box w={1} >
              <InvertContent>Curious to learn more? Drop us a line at:</InvertContent>
            </Box>

            <Box w={1}>
              <InvertLinkMail href="mailto:hello@shape.space">hello@shape.space</InvertLinkMail>
            </Box>

            <Box w={1} py={32} wrap>
              <InvertContent>Stay current on new features and case studies by
                signing up for our mailing list:</InvertContent>
            </Box>

            <Box w={1}>
              <SubscribeEmail />
            </Box>

            <Box w={1} py={16}>
              <InvertLink href="https://www.ideo.com/" rel="noopener noreferrer" target="_blank">
                <img src={poweredByIdeo} alt="Powered by IDEO" />
              </InvertLink>
            </Box>

            <Box w={1 / 2} >
              <section align="right"><InvertLink href="https://www.ideo.com/privacy">Privacy and Cookie Policy</InvertLink></section>
            </Box>
            <Box w={1 / 8} />
            <Box w={3 / 8}><section align="left">&copy; 2018</section></Box>

          </Flex>
        </Footer>

      </Fragment>
    )
  }
}

export default MarketingPage
