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
    return (
      <MarketingFooter>
        <ScrollElement name="FooterAnchor" />
        <MarketingFlex align="center" justify="center" wrap w={1}>
          <Box w={1} mb={[10, '4px']}>
            <InvertMarketingH1Bold>
              {this.props.footerHeader}
            </InvertMarketingH1Bold>
          </Box>
          <Box w={1}>
            <InvertMarketingH1>{this.props.footerSubheader}</InvertMarketingH1>
          </Box>
          <Box w={1} pt={[46, 65]} pb={[46, 74]} mb={[10, 0]}>
            <a className="get-early-access-footer" href="/sign_up">
              <MarketingCallToAction>
                {this.props.footerButtons[0]}
              </MarketingCallToAction>
            </a>
          </Box>

          <ResponsivePadInlineBlock>
            <InvertedCentered>{this.props.contactHeader}</InvertedCentered>
          </ResponsivePadInlineBlock>
          <ResponsivePadInlineBlock>
            <InvertedCentered>{this.props.contactHeader2}</InvertedCentered>
          </ResponsivePadInlineBlock>

          <Box w={1}>
            <InvertMarketingLinkMail href="mailto:hello@shape.space">
              hello@shape.space
            </InvertMarketingLinkMail>
          </Box>

          <Box w={1} mt={(0, 5)} wrap>
            <InvertedFixedWidth>
              {this.props.subscriptionHeader}
            </InvertedFixedWidth>
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
  footerHeader: PropTypes.string,
  footerSubheader: PropTypes.string,
  footerButtons: PropTypes.array,
  contactHeader: PropTypes.string,
  contactHeader2: PropTypes.string,
  subscriptionHeader: PropTypes.string,
}

PageFooter.defaultProps = {
  footerHeader: '',
  footerSubheader: '',
  footerButtons: [],
  contactHeader: '',
  contactHeader2: '',
  subscriptionHeader: '',
}

export default PageFooter
