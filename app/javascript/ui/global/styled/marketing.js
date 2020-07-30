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
  color: ${v.colors.commonLightest};
  background: white;
  padding-top: 0px;
`
MarketingBack.displayName = 'StyledMarketingBack'

/** @component */
export const MarketingGradientTop = styled(MarketingBack)`
  background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 1) 100%
    ),
    url(${organicGridPillGray}), no-repeat, right, top;
  overflow: hidden;
  position: relative;
  padding-bottom: 40px;
`
MarketingGradientTop.displayName = 'StyledMarketingGradientTop'

/** @component */
export const MarketingFooter = styled.div`
  text-align: center;
  background: ${v.colors.secondaryLight};
  font-family: ${v.fonts.sans};
  color: ${v.colors.commonLightest};
  font-size: 1rem;
  padding-top: 56px;
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
  line-height: 38px;
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
  color: ${v.colors.commonLightest};
  text-transform: none;
`
InvertMarketingH1.displayName = 'StyledInvertMarketingH1'

/** @component */
export const InvertMarketingH1Bold = styled(MarketingH1Bold)`
  color: ${v.colors.commonLightest};
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
  color: ${v.colors.commonLightest};
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
  margin-bottom: ${props => (props.videoPlaying ? '12px' : '68px')};

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    font-size: ${props => (props.videoPlaying ? '22px' : '32px')};
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
export const MarketingHeroButtonContainer = styled.div`
  width: 100%;
`
MarketingHeroButtonContainer.displayName = 'StyledMarketingButtonContainer'

/** @component */
export const MarketingMainBtn = styled(MarketingContentLink)`
  background-color: ${v.colors.caution};
  border-radius: 4px;
  border: 2px solid ${v.colors.caution};
  padding: 12px 16px;
  margin: 0;
  margin-right: 16px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: ${v.weights.medium};
  ${props => props.width && `width: ${props.width}px;`}
`
MarketingMainBtn.displayName = 'StyledMarketingMainBtn'

/** @component */
export const MarketingAlternateBtn = styled(MarketingMainBtn)`
  background-color: white;
  border: 2px solid black;
  padding: 12px 16px;
  width: 180px;
`
MarketingAlternateBtn.displayName = 'StyledMarketingAlternateBtn'

const videoRatio = 1.7777777778
const videoWidth = 780

export const VideoDimensions = {
  width: `${videoWidth}px`,
  height: `${Math.round(videoWidth / videoRatio)}px`,
}

/** @component */
export const MarketingVideoWrapper = styled.div`
  margin-bottom: ${props => (props.videoPlaying ? '35px' : '0')};
  z-index: ${props => (props.videoPlaying ? '1' : '-1')};
  height: ${props => (props.videoPlaying ? VideoDimensions.height : '0')};
  width: ${props => (props.videoPlaying ? VideoDimensions.width : '0')};
  max-width: 100vw;
  opacity: ${props => (props.videoPlaying ? '1' : '0')};
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: 100vw;
    margin-left: auto;
    margin-right: auto;
  }
`

MarketingVideoWrapper.displayName = 'StyledMarketingVideoWrapper'

/** @component */
export const MarketingStandaloneVideoWrapper = styled.div`
  z-index: 1;
  height: ${VideoDimensions.height};
  width: ${VideoDimensions.width};
  max-width: 100vw;
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: 100vw;
    margin-left: auto;
    margin-right: auto;
  }
`

MarketingStandaloneVideoWrapper.displayName =
  'StyledMarketingStandaloneVideoWrapper'

/** @component */
export const MarketingHeavyCTA = styled(MarketingMainBtn)`
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
  color: ${props => props.color};
  letter-spacing: -0.2px;
  font-size: 18px;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`
MarketingContent.displayName = 'StyledMarketingContent'
MarketingContent.defaultProps = {
  color: 'black',
}

/** @component */
export const InvertedCentered = styled(MarketingContent)`
  color: ${v.colors.commonLightest};
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
  color: ${v.colors.commonLightest};
  letter-spacing: -0.2px;
  font-size: ${props => props.fontSize || 18}px;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`
MarketingStyledLink.displayName = 'StyledMarketingStyledLink'

/** @component */
export const InvertMarketingLink = styled(MarketingStyledLink)`
  color: ${v.colors.commonLightest};
`
InvertMarketingLink.displayName = 'StyledInvertMarketingLink'

/** @component */
export const InvertMarketingLinkMail = styled(Anchor)`
  color: ${v.colors.commonLightest};
  letter-spacing: -0.2px;
  font-size: ${props => props.fontSize}px;
  font-family: ${props =>
    props.fontSize === 32 ? v.fonts.serif : v.fonts.sans};
  margin-bottom: ${props => (props.fontSize === 32 ? 68 : 20)}px;
  display: inline-block;
`
InvertMarketingLinkMail.defaultProps = {
  fontSize: 32,
}
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
  height: ${props => (props.videoPlaying ? '90px' : 'auto')};

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    max-width: 410px;
  }
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
    margin-top: ${props => (props.videoPlaying ? '64px' : '126px')};
    height: ${props => (props.videoPlaying ? '124px' : '248px')};
  }
`
MarketingShapeLogo.displayName = 'StyledMarketingShapeLogo'

const space = [0, 8, 16, 32, 64]
// These breakpoints are based on REMs, e.g., 52*16 = 832px
const breakpoints = [40, 52, 64]

export function MarketingFlex(props) {
  return (
    <ReflexProvider cspace={space} breakpoints={breakpoints}>
      <Flex {...props} />
    </ReflexProvider>
  )
}

export const Card = styled.div`
  border-radius: 8px;
  box-shadow: 0 3px 10px 0 rgba(0, 0, 0, 0.08);
  background-color: white;
  border: solid 1px rgba(0, 0, 0, 0.1);
`

export const NavLink = styled.a`
  font-weight: ${v.weights.medium};
  font-family: ${v.fonts.sans};
  font-size: 12px;
  letter-spacing: 0.4px;
  color: black;
  margin: 1em;
  padding: 6px 12px;
  cursor: pointer;
  text-transform: uppercase;
  text-decoration: none;
}
`
