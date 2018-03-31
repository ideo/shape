import PropTypes from 'prop-types'
import styled from 'styled-components'
import { action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import SearchBar from '~/ui/layout/SearchBar'
import Avatar from '~/ui/global/Avatar'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

const StyledHeader = styled.header`
  z-index: ${v.zIndex.header};
  position: fixed;
  top: 0;
  width: calc(100% - ${v.containerPadding.horizontal}*2);
  background: ${v.colors.cararra};
  padding: 1rem ${v.containerPadding.horizontal};
`

const MaxWidthContainer = styled.div`
  max-width: ${v.maxWidth}px;
  margin: 0 auto;
`

// TODO trying to fix alignment issues
const MaxWidthInnerContainer = styled.div`
  max-width: 1320px;
`

@inject('apiStore')
@observer
class Header extends React.Component {
  @action handleOrgClick = (ev) => {
    uiStore.update('organizationMenuOpen', true)
  }

  render() {
    const { apiStore, children } = this.props
    const { currentUser } = apiStore
    const primaryGroup = currentUser.current_organization.primary_group
    return (
      <StyledHeader>
        <MaxWidthContainer>

          <Flex align="center" justify="space-between">
            <Box>
              <PlainLink to="/">
                <Logo />
              </PlainLink>
            </Box>

            <Box flex>
              <SearchBar />
              <button onClick={this.handleOrgClick}>
                <Avatar
                  title={primaryGroup.name}
                  url={primaryGroup.filestack_file_url}
                  className="organizationAvatar"
                />
              </button>
              <Avatar
                title={currentUser.name}
                url={currentUser.pic_url_square}
                className="userAvatar"
              />
            </Box>
          </Flex>

          <MaxWidthInnerContainer>
            { children }
          </MaxWidthInnerContainer>

        </MaxWidthContainer>
      </StyledHeader>

    )
  }
}

Header.propTypes = {
  children: PropTypes.node,
}
Header.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
Header.defaultProps = {
  children: null,
}

export default Header
