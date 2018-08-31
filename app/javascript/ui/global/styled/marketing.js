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
  background: linear-gradient(
      to bottom, transparent 0%, ${v.colors.white} 100%)
      ,url(${organicGridPillGray})
      , no-repeat
      , right
      , top;
  background-size: 200%;
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
  padding-top: 50px;
  padding-bottom: 22px;
  padding-right: 24px;
  padding-left: 24px;
  
  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    padding-left: 0px;
    padding-right: 0px;
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
    margin-right: 20px;
  }
`
ResponsiveInlineBlock.displayName = 'StyledResponsiveInlineBlock'

export const ResponsivePadInlineBlock = styled(ResponsiveInlineBlock)`
  & > * {
    margin-bottom: 13px;
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
  color: black;
  font-size: 2rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.bold};
  letter-spacing: 0px;
  white-space: normal;
  text-align: center;
`
MarketingH1.displayName = 'StyledMarketingH1'

/** @component */
export const InvertMarketingH1 = styled(MarketingH1)`
  color: ${v.colors.desert};
  text-transform: none;
`
InvertMarketingH1.displayName = 'StyledInvertMarketingH1'

/** @component */
export const MarketingH2 = styled(Heading2)`
  color: black;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
  font-size: 1.25rem;
  letter-spacing: 0;
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

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
      font-size: 32px;
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

  &:hover {
    color: ${v.colors.white};
    background-color: black;
  }
`
MarketingContentLink.displayName = 'StyledMarketingContentLink'

/** @component */
export const MarketingCallToAction = styled(MarketingContentLink)`
  background-color: ${v.colors.cautionYellow};
  border-radius: 4px;
  border: 1px solid ${v.colors.cautionYellow};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: ${v.weights.medium};
`
MarketingCallToAction.displayName = 'StyledMarketingCallToAction'

/** @component */
export const MarketingVideoLink = styled(MarketingContentLink)`
  border-radius: 4px;
  border: 2px solid black;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: ${v.weights.medium};
`
MarketingVideoLink.displayName = 'StyledMarketingVideoLink'

/** @component */
export const MarketingHeavyCTA = styled(MarketingCallToAction)`
  font-weight: ${v.weights.bold};
  font-family: ${v.fonts.sans};
  margin-top: 68px;
  margin-bottom: 68px;
`
MarketingHeavyCTA.displayName = 'StyledMarketingHeavyCTA'

/** @component */
export const MarketingContent = styled.div`
  color: black;
  letter-spacing: -0.2px;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`
MarketingContent.displayName = 'StyledMarketingContent'

export const InvertMarketingContent = styled(MarketingContent)`
  color: ${v.colors.desert};
`
InvertMarketingContent.displayName = 'StyledInvertMarketingContent'

/** @component */
export const MarketingStyledLink = styled(Anchor)`
    color: ${v.colors.desert};
    letter-spacing: -0.2px;
    font-size: 1rem;
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
`
InvertMarketingLinkMail.displayName = 'StyledInvertMarketingLinkMail'

/** @component */
export const MarketingBetaSticker = styled.img.attrs({
  src: 'https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fcommon%2Fbeta-stick-2.png?alt=media&token=72957149-16e5-4c70-aa80-3a5ac129fa34'
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
  src: 'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo.svg'
})`
  alt: 'Shape';
  width: 100%;
  max-width: 256px;
  margin-top: 120px;

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
    <ReflexProvider
      space={space}
      breakpoints={breakpoints}
    >
      <Flex {...props} />
    </ReflexProvider>
  )
}
