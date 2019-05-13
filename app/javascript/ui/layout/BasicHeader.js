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
    const { orgMenu, children } = this.props

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

              {children}

              <Box flex align="center">
                {orgMenu && (
                  <OrganizationMenu
                    organization={{}}
                    userGroups={[]}
                    onClose={() => null}
                    open={orgMenu}
                    locked
                  />
                )}
              </Box>
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
  children: PropTypes.node,
}

BasicHeader.defaultProps = {
  children: null,
}

export default BasicHeader
