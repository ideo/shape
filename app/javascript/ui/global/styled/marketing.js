import styled from 'styled-components'
import v from '~/utils/variables'
import { Heading1, Heading2, Anchor } from '~/ui/global/styled/typography'
import { ReflexProvider, Flex } from 'reflexbox'
import organicGridPillGray from '~/assets/organic_grid_pill_gray.png'

/** @component */
export const MarketingBack = styled.div`
  text-align: center;
  box-sizing: content-box;
  width: 100%;
  border: none;
  overflow: auto;
  color: ${v.colors.nearwhite};
  background: white;
  padding-top: 0px;
`
MarketingBack.displayName = 'StyledMarketingBack'

/** @component */
export const MarketingGradientTop = MarketingBack.extend`
  background: linear-gradient(to bottom, transparent 0%, ${v.colors.white} 100%),
    url(${organicGridPillGray}), no-repeat, right, top;
  overflow: hidden;
  position: relative;
  padding-bottom: 40px;
`
MarketingGradientTop.displayName = 'StyledMarketingGradientTop'

/** @component */
export const MarketingFooter = styled.div`
  text-align: center;
  background: ${v.colors.activityLightBlue};
  font-family: ${v.fonts.sans};
  color: ${v.colors.desert};
  font-size: 1rem;
  padding-top: 52px;
  padding-bottom: 22px;
  padding-right: 24px;
  padding-left: 24px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    padding-left: 0px;
    padding-right: 0px;
  }

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    h1 {
      line-height: 26px;
      padding: 0;
    }
  }
`
MarketingFooter.displayName = 'StyledMarketingFooter'

/** @component */
export const ResponsiveInlineBlock = styled(Flex)`
  & > * {
    display: block;
    margin: auto;
  }

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    display: inline-block;
    margin-right: 6px;
  }
`
ResponsiveInlineBlock.displayName = 'StyledResponsiveInlineBlock'

export const ResponsivePadInlineBlock = styled(ResponsiveInlineBlock)`
  & > * {
    margin-bottom: 13px;
  }

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: 100%;
    margin-bottom: 4px;
  }
`
ResponsivePadInlineBlock.displayName = 'StyledResponsivePadInlineBlock'

export const DesktopSpacer = styled.span`
  display: none;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    display: inline-block;
  }
`
DesktopSpacer.displayName = 'StyledDesktopSpacer'

/** @component */
export const Center = styled.span`
  text-align: center;
  margin: auto;
`
Center.displayName = 'StyledCenter'

/** @component */
export const MarketingH1 = styled(Heading1)`
  font-weight: ${v.weights.book};
  color: black;
  font-size: 24px;
  font-family: ${v.fonts.sans};
  letter-spacing: 0px;
  white-space: normal;
  text-align: center;
  margin-bottom: 0;
  margin-top: 0;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    font-size: 32px;
  }
`
MarketingH1.displayName = 'StyledMarketingH1'

/** @component */
export const MarketingH1Bold = styled(MarketingH1)`
  font-weight: ${v.weights.bold};
`
MarketingH1Bold.displayName = 'StyledMarketingH1Bold'

/** @component */
export const InvertMarketingH1 = styled(MarketingH1)`
  color: ${v.colors.desert};
  text-transform: none;
`
InvertMarketingH1.displayName = 'StyledInvertMarketingH1'

/** @component */
export const InvertMarketingH1Bold = styled(MarketingH1Bold)`
  color: ${v.colors.desert};
  text-transform: none;
`
InvertMarketingH1Bold.displayName = 'StyledInvertMarketingH1Bold'

/** @component */
export const MarketingH2 = styled(Heading2)`
  color: black;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
  font-size: 24px;
  letter-spacing: 0;
  margin-bottom: 0;
  margin-top: 0;
  white-space: normal;
`
MarketingH2.displayName = 'StyledMarketingH2'

/** @component */
export const InvertMarketingH2 = styled(MarketingH2)`
  color: ${v.colors.desert};
  text-transform: none;
`
InvertMarketingH2.displayName = 'StyledInvertMarketingH2'

/** @component */
export const MarketingTagLine = styled(MarketingH2)`
  color: black;
  text-transform: none;
  font-family: ${v.fonts.serif};
  font-weight: ${v.weights.book};
  font-size: 24px;
  max-width: 600px;
  margin: auto;
  margin-bottom: 68px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    font-size: 32px;
  }

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    padding: 0 24px;
    margin-bottom: 76px;
  }
`
MarketingTagLine.displayName = 'StyledMarketingTagLine'

/** @component */
export const MarketingContentLink = styled.button`
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  color: black;
  margin: 8px;
  padding: 12px 12px;
  cursor: pointer;
  letter-spacing: 1.5px;
  margin-top: 8px;
  margin-bottom: 8px;
  transition: background-color 0.15s ease, color 0.15s ease, border 0.15s ease;

  &:hover {
    color: ${v.colors.white};
    background-color: black;
    border-color: black;
  }
`
MarketingContentLink.displayName = 'StyledMarketingContentLink'

/** @component */
export const MarketingCallToAction = styled(MarketingContentLink)`
  background-color: ${v.colors.cautionYellow};
  border-radius: 4px;
  border: 2px solid ${v.colors.cautionYellow};
  padding: 12px 16px;
  margin: 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: ${v.weights.medium};
`
MarketingCallToAction.displayName = 'StyledMarketingCallToAction'

/** @component */
export const MarketingVideoLink = styled(MarketingCallToAction)`
  background-color: white;
  border: 2px solid black;
  padding: 16px 18px;
`
MarketingVideoLink.displayName = 'StyledMarketingVideoLink'

/** @component */
export const MarketingHeavyCTA = styled(MarketingCallToAction)`
  font-weight: ${v.weights.bold};
  font-family: ${v.fonts.sans};
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 14px;
  padding-bottom: 14px;
  letter-spacing 1.5px;
  margin-top: 36px;
  margin-bottom: 36px;
`
MarketingHeavyCTA.displayName = 'StyledMarketingHeavyCTA'

/** @component */
export const MarketingContent = styled.div`
  color: black;
  letter-spacing: -0.2px;
  font-size: 18px;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`
MarketingContent.displayName = 'StyledMarketingContent'

/** @component */
export const InvertedCentered = styled(MarketingContent)`
  color: ${v.colors.desert};
  margin: auto;
`
InvertedCentered.displayName = 'StyledInverInvertedCentered'

/** @component */
export const InvertedFixedWidth = styled(InvertedCentered)`
  width: 325px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    width: 456px;
  }
`
InvertedFixedWidth.displayName = 'StyledInvertedFixedWidth'

/** @component */
export const MarketingStyledLink = styled(Anchor)`
  color: ${v.colors.desert};
  letter-spacing: -0.2px;
  font-size: 18px;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`
MarketingStyledLink.displayName = 'StyledMarketingStyledLink'

/** @component */
export const InvertMarketingLink = styled(MarketingStyledLink)`
  color: ${v.colors.desert};
`
InvertMarketingLink.displayName = 'StyledInvertMarketingLink'

/** @component */
export const InvertMarketingLinkMail = styled(Anchor)`
  color: ${v.colors.desert};
  letter-spacing: -0.2px;
  font-size: 32px;
  font-family: ${v.fonts.serif};
  margin-bottom: 68px;
  display: inline-block;
`
InvertMarketingLinkMail.displayName = 'StyledInvertMarketingLinkMail'

/** @component */
export const MarketingBetaSticker = styled.img.attrs({
  src:
    'https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fcommon%2Fbeta-stick-2.png?alt=media&token=72957149-16e5-4c70-aa80-3a5ac129fa34',
})`
  alt: 'In Beta!';
  width: 100%;
  max-width: 126px;
  top: 80px;
  right: 0;
  position: absolute;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    max-width: 244px;
  }
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
    top: 126px;
    max-width: 322px;
  }
`
MarketingBetaSticker.displayName = 'StyledMarketingBetaSticker'

/** @component */
export const MarketingShapeLogo = styled.img.attrs({
  ref: 'MarketingShapeLogo',
  src: 'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo.svg',
  alt: 'Shape',
})`
  width: 100%;
  max-width: 256px;
  margin-top: 75px;
  padding-bottom: 16px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    max-width: 410px;
  }
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
    margin-top: 126px;
  }
`
MarketingShapeLogo.displayName = 'StyledMarketingShapeLogo'

const space = [0, 8, 16, 32, 64]
const breakpoints = [40, 52, 64]

export function MarketingFlex(props) {
  return (
    <ReflexProvider space={space} breakpoints={breakpoints}>
      <Flex {...props} />
    </ReflexProvider>
  )
}
