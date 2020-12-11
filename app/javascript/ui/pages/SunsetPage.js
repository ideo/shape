import { Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { Box } from 'reflexbox'

import {
  MarketingBack,
  MarketingFlex,
  MarketingH1Bold,
} from '~/ui/global/styled/marketing'
import MarketingMenu from '~/ui/marketing/MarketingMenu'
import ContentBlock from '~/ui/marketing/ContentBlock'
import PageFooter from '~/ui/marketing/PageFooter'
import { Subtitle } from '~/ui/pages/MarketingProductPage'

class SunsetPage extends React.PureComponent {
  get sunsetContent() {
    return (
      <div>
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>
        <MarketingFlex column align="center" justify="center" wrap w={1}>
          <Box w={0.75} mt={34} pr={[3, 0, 0]} pl={[3, 0, 0]}>
            <MarketingH1Bold>
              Shape is winding down operations and will end service on February
              25, 2021.
            </MarketingH1Bold>
          </Box>
          <Box w={[1, 0.6, 590]} mt={44} pr={[3, 0, 0]} pl={[3, 0, 0]}>
            <Subtitle>
              We have made the difficult decision to wind down operations of the
              Shape product offering. For instructions on how to export your
              work, see below. As a parting gift, we have opened our Github
              repository for Shape{' '}
              <a target="_blank" href="https://github.com/ideo/shape">
                here
              </a>
              . Thank you for being a member of the Shape community.
            </Subtitle>
          </Box>
        </MarketingFlex>

        <ContentBlock
          order={1}
          title={'Create PDFs of your work.'}
          content={
            'To save any of your work in Shape, use the “Print to PDF” function by clicking on the 3 dots at the top of a collection or using the keyboard shortcut, &#8984;+P or Ctrl+P, to print your collection.'
          }
          imageUrl="https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fweb%2Fprint-to-pdf.gif?alt=media&token=75ce27ca-97d7-42a4-9810-44f7abbb1caa"
        />
        <ContentBlock
          order={2}
          title={'Our codebase is now open source.'}
          content={`Shape was built with Ruby on Rails, combining a JSON:API backend and a React single-page app front-end. Between a heavy-lifting UI with draggable components, real-time text editing, and various other features, there is quite a lot going on in there. Feel free to peruse the code and hopefully find something useful.
            <a target="_blank" href="https://github.com/ideo/shape">Shape on Github</a>`}
          imageUrl="https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fweb%2Fshape-github.png?alt=media&token=80b76b7c-37d4-434f-83e7-e4f776b0150c"
        />
      </div>
    )
  }

  render() {
    return (
      <Fragment>
        <MarketingBack>
          <MarketingMenu location={location} />
          {this.sunsetContent}
        </MarketingBack>
        <PageFooter />
      </Fragment>
    )
  }
}

export default SunsetPage
