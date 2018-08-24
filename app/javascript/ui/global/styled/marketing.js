import styled from 'styled-components'
import v from '~/utils/variables'
import { Heading1, Heading2, Anchor } from '~/ui/global/styled/typography'
import { ReflexProvider, Flex } from 'reflexbox'

/** @component */
export const MarketingFooter = styled.div`
  text-align: center;
  background: ${v.colors.activityLightBlue};
  font-family: ${v.fonts.sans};
  color: white;
  font-size: 1rem;
`

/** @component */
export const MarketingBack = styled.div`
  text-align: center;
  box-sizing: content-box;
  width: 100%;
  border: none;
  overflow: auto;
  color: rgb(247, 247, 247);
  background: white;
  margin-left: 0px;
  margin-right: 0px;
  padding-top: 2rem;
`
// TODO: remove browser-prefixes
/** @component */
export const MarketingGradientTop = MarketingBack.extend`
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

/** @component */
export const MarketingH1 = styled(Heading1)`
  color: black;
  font-size: 2rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.bold};
  letter-spacing: 0px;
  white-space: normal;
`

/** @component */
export const InvertMarketingH1 = styled(MarketingH1)`
  color: white;
`

/** @component */
export const MarketingH2 = styled(Heading2)`
color: black;
font-family: ${v.fonts.sans};
font-weight: ${v.weights.book};
font-size: 1.25rem;
letter-spacing: 0px;
white-space: normal;
`

/** @component */
export const InvertMarketingH2 = styled(Heading2)`
  color: white;
`

/** @component */
export const MarketingTagLine = styled(MarketingH2)`
  color: black;
  font-family: ${v.fonts.serif};
  font-weight: ${v.weights.medium};
`

/** @component */
export const MarketingContentLink = styled.button`
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

/** @component */
export const MarketingCallToAction = styled(MarketingContentLink)`
  background-color: #fcf113;
  border-radius: 4px;
  border: 1px solid #fcf113;
`

/** @component */
export const MarketingVideoLink = styled(MarketingContentLink)`
  border-radius: 4px;
  border: 2px solid black;
`

/** @component */
export const MarketingHeavyCTA = styled(MarketingCallToAction)`
  font-weight: ${v.weights.bold};
  font-family: ${v.fonts.sans};
`

/** @component */
export const MarketingContent = styled.div`
  color: black;
  letter-spacing: -0.2px;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`
export const InvertMarketingContent = styled(MarketingContent)`
  color: white;
`

/** @component */
export const MarketingStyledLink = styled(Anchor)`
    color: white;
    letter-spacing: -0.2px;
    font-size: 1rem;
    font-family: ${v.fonts.sans};
    font-weight: ${v.weights.book};
`

/** @component */
export const InvertMarketingLink = styled(MarketingStyledLink)`
    color: white;
`

/** @component */
export const InvertMarketingLinkMail = styled(Anchor)`
    color: white;
    letter-spacing: -0.2px;
    font-size: 2.25rem;
    font-family: ${v.fonts.serif};
`

/** @component */
export const MarketingBetaSticker = styled.img.attrs({
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

/** @component */
export const MarketingShapeLogo = styled.img.attrs({
  ref: 'MarketingShapeLogo',
  src: 'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo.svg'
})`
  alt: 'Shape';
  width: 60%;
  max-width: 100%;
`

const space = [0, 8, 16, 32, 64]
const breakpoints = [40, 52, 64]

export function MarketingFlex(props) {
  return (
    <ReflexProvider
      space={space}
      breakpoints={breakpoints}
    >
      <Flex {...props} />
    </ReflexProvider>
  )
}
