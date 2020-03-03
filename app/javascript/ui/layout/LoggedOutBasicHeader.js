import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Fragment } from 'react'
import { Flex, Box } from 'reflexbox'
import styled from 'styled-components'

import {
  FixedHeader,
  MaxWidthContainer,
  HeaderSpacer,
} from '~/ui/global/styled/layout'
import { Heading3 } from '~/ui/global/styled/typography'
import Avatar from '~/ui/global/Avatar'
import Logo from '~/ui/layout/Logo'
import v from '~/utils/variables'
import { loginRedirectPath } from '~/utils/url'

const StyledLoginLink = styled(Heading3)`
  margin-left: 15px;
  margin-bottom: 0px;
  a {
    color: ${v.colors.secondaryDarkest};
    text-decoration: none;
    line-height: 1.5rem;
  }
`
StyledLoginLink.displayName = 'StyledLoginLink'

class LoggedOutBasicHeader extends React.PureComponent {
  render() {
    const { organization, redirectPath } = this.props

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
                <Flex align="center">
                  {organization && (
                    <Avatar
                      title={organization.name}
                      url={organization.filestack_file_url}
                      className="organization-avatar"
                      responsive={false}
                    />
                  )}
                  <StyledLoginLink>
                    <a href={loginRedirectPath(redirectPath)}>Log in</a>
                  </StyledLoginLink>
                </Flex>
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
  organization: MobxPropTypes.objectOrObservableObject,
  redirectPath: PropTypes.string,
}

LoggedOutBasicHeader.defaultProps = {
  organization: null,
  redirectPath: null,
}

export default LoggedOutBasicHeader
