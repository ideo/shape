import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Fragment } from 'react'
import { Flex, Box } from 'reflexbox'

import {
  FixedHeader,
  MaxWidthContainer,
  HeaderSpacer,
} from '~/ui/global/styled/layout'
import Avatar from '~/ui/global/Avatar'
import Logo from '~/ui/layout/Logo'
import v from '~/utils/variables'

class LoggedOutBasicHeader extends React.PureComponent {
  render() {
    const { organization } = this.props

    return (
      <Fragment>
        <FixedHeader>
          <MaxWidthContainer>
            <Flex
              align="center"
              justify="space-between"
              style={{ minHeight: v.headerHeight }}
            >
              <Box>
                {/* normal <a> will route back to MarketingPage */}
                <a href="/">
                  <Logo />
                </a>
              </Box>

              <Box>
                <Avatar
                  title={organization.name}
                  url={organization.filestack_file_url}
                  className="organization-avatar"
                  responsive={false}
                />
                <a href="/login">Log in</a>
              </Box>
            </Flex>
          </MaxWidthContainer>
        </FixedHeader>
        <HeaderSpacer />
      </Fragment>
    )
  }
}

LoggedOutBasicHeader.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default LoggedOutBasicHeader
