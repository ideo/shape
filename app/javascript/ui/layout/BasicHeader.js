import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { Flex, Box } from 'reflexbox'

import {
  FixedHeader,
  MaxWidthContainer,
  HeaderSpacer,
} from '~/ui/global/styled/layout'
import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import v from '~/utils/variables'

class BasicHeader extends React.PureComponent {
  render() {
    const { orgMenu } = this.props

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
                <PlainLink to="/">
                  <Logo />
                </PlainLink>
              </Box>

              {orgMenu && (
                <OrganizationMenu
                  organization={{}}
                  userGroups={[]}
                  onClose={() => null}
                  open={orgMenu}
                  locked
                />
              )}
            </Flex>
          </MaxWidthContainer>
        </FixedHeader>
        <HeaderSpacer />
      </Fragment>
    )
  }
}

BasicHeader.propTypes = {
  orgMenu: PropTypes.bool.isRequired,
}

export default BasicHeader
