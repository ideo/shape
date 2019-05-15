import Hidden from '@material-ui/core/Hidden'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Fragment } from 'react'
import { Flex, Box } from 'reflexbox'

import AdminUsersModal from '~/ui/admin/AdminUsersModal'
import AdminUsersSummary from '~/ui/admin/AdminUsersSummary'
import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import v from '~/utils/variables'
import {
  FixedHeader,
  MaxWidthContainer,
  HeaderSpacer,
} from '~/ui/global/styled/layout'

const StyledHeadingWrapper = styled.div`
  margin-left: 0.5rem;
  margin-top: 0.5rem;
  height: 1.2rem;
  white-space: nowrap;
  line-height: 1;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  color: ${v.colors.black};
`

@inject('routingStore', 'uiStore')
@observer
class AdminHeader extends React.Component {
  showAdminUsersDialog = () => {
    const { uiStore } = this.props
    uiStore.update('adminUsersMenuOpen', true)
  }

  render() {
    const { routingStore, uiStore } = this.props

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
                <PlainLink to={routingStore.pathTo('admin')}>
                  <Logo />
                </PlainLink>
              </Box>

              <Box auto>
                <Flex align="center">
                  <StyledHeadingWrapper>Shape Admin</StyledHeadingWrapper>
                  <Hidden smDown>
                    <AdminUsersSummary
                      handleClick={this.showAdminUsersDialog}
                    />
                  </Hidden>
                </Flex>
              </Box>
            </Flex>
            <AdminUsersModal open={!!uiStore.adminUsersMenuOpen} />
          </MaxWidthContainer>
        </FixedHeader>
        <HeaderSpacer />
      </Fragment>
    )
  }
}

AdminHeader.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminHeader
