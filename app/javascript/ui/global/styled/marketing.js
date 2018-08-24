import styled from 'styled-components'
import v from '~/utils/variables'
import { Heading1, Heading2, Anchor } from '~/ui/global/styled/typography'
import { ReflexProvider, Flex } from 'reflexbox'

import organicGridPillGray from '~/assets/organic_grid_pill_gray.png'

/** @component */
export const MarketingFooter = styled.div`
  text-align: center;
  background: ${v.colors.activityLightBlue};
  font-family: ${v.fonts.sans};
  color: white;
  font-size: 1rem;
  padding: 50px 0;
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
  background-image: url(${organicGridPillGray});
  padding-bottom: 50px;
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
  text-transform: none;
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
  color: #f5f4f3;
  text-transform: none;
  letter-spacing: 0;
`

/** @component */
export const MarketingTagLine = styled(MarketingH2)`
  color: black;
  text-transform: none;
  font-family: ${v.fonts.serif};
  font-weight: ${v.weights.book};  
  font-size: 24px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
      font-size: 32px;
  }
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
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: ${v.weights.medium};
`

/** @component */
export const MarketingVideoLink = styled(MarketingContentLink)`
  border-radius: 4px;
  border: 2px solid black;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: ${v.weights.medium};
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
    color: #f5f4f3;
`

/** @component */
export const InvertMarketingLinkMail = styled(Anchor)`
    color: #f5f4f3;
    letter-spacing: -0.2px;
    font-size: 32px;
    font-family: ${v.fonts.serif};
`

/** @component */
export const MarketingBetaSticker = styled.img.attrs({
  src: 'https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fcommon%2Fbeta-stick-2.png?alt=media&token=72957149-16e5-4c70-aa80-3a5ac129fa34'
})`
  alt: 'In Beta!';
  width: 100%;
  max-width: 126px;
  top: 50px;
  right: 0;
  position: absolute;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
      max-width: 244px;
  }
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
      top: 75px;
      max-width: 322px;
  }
`

/** @component */
export const MarketingShapeLogo = styled.img.attrs({
  ref: 'MarketingShapeLogo',
  src: 'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo.svg'
})`
  alt: 'Shape';
  width: 100%;
  max-width: 410px;
  margin-top: 40px;
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
