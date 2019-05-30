import PropTypes from 'prop-types'
import { Element as ScrollElement } from 'react-scroll'
import { Box } from 'reflexbox'
import {
  MarketingFooter,
  InvertMarketingLink,
  InvertMarketingH1,
  InvertMarketingH1Bold,
  InvertMarketingLinkMail,
  MarketingCallToAction,
  MarketingFlex,
  ResponsivePadInlineBlock,
  DesktopSpacer,
  Center,
  InvertedCentered,
  InvertedFixedWidth,
} from '~/ui/global/styled/marketing.js'

import poweredByIdeo from '~/assets/Powered-by-IDEO-Inverted.png'
import SubscribeEmail from '~/ui/marketing/SubscribeEmail'
class PageFooter extends React.PureComponent {
  render() {
    const {
      header,
      subHeader,
      buttonText,
      contactHeader,
      mailingList,
    } = this.props.content
    return (
      <MarketingFooter>
        <ScrollElement name="FooterAnchor" />
        <MarketingFlex align="center" justify="center" wrap w={1}>
          <Box w={1} mb={[10, '4px']}>
            <InvertMarketingH1Bold>{header}</InvertMarketingH1Bold>
          </Box>
          <Box w={1}>
            <InvertMarketingH1>{subHeader}</InvertMarketingH1>
          </Box>
          <Box w={1} pt={[46, 65]} pb={[46, 74]} mb={[10, 0]}>
            <a className="get-early-access-footer" href="/sign_up">
              <MarketingCallToAction>{buttonText}</MarketingCallToAction>
            </a>
          </Box>

          <ResponsivePadInlineBlock>
            <InvertedCentered>{contactHeader}</InvertedCentered>
          </ResponsivePadInlineBlock>

          <Box w={1}>
            <InvertMarketingLinkMail href="mailto:hello@shape.space">
              hello@shape.space
            </InvertMarketingLinkMail>
          </Box>

          <Box w={1} mt={(0, 5)} wrap>
            <InvertedFixedWidth>{mailingList}</InvertedFixedWidth>
          </Box>

          <Box w={1} mt={[8, 0]}>
            <SubscribeEmail />
          </Box>

          <Box w={1}>
            <InvertMarketingLink
              href="https://www.ideo.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <img
                src={poweredByIdeo}
                alt="Powered by IDEO"
                style={{
                  width: '95px',
                  paddingTop: '55px',
                  paddingBottom: '30px',
                }}
              />
            </InvertMarketingLink>
          </Box>
        </MarketingFlex>

        <Center>
          <ResponsivePadInlineBlock>
            <InvertMarketingLink href="https://www.ideo.com/privacy">
              Privacy and Cookie Policy
            </InvertMarketingLink>
          </ResponsivePadInlineBlock>
        </Center>
        <Center>
          <ResponsivePadInlineBlock>
            <DesktopSpacer style={{ width: '80px' }} />
            <InvertMarketingLink href="https://www.ideo.com/">
              {/* Added span around &copy; in order to satisfy "jsx-a11y/accessible-emoji" */}
              <span role="img" aria-label="Copyright Symbol">
                &copy;
              </span>{' '}
              2018
            </InvertMarketingLink>
          </ResponsivePadInlineBlock>
        </Center>
      </MarketingFooter>
    )
  }
}

PageFooter.propTypes = {
  content: PropTypes.object,
}

PageFooter.defaultProps = {
  content: {},
}

export default PageFooter
