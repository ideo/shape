import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Fragment } from 'react'
import { Flex, Box } from 'reflexbox'

import {
  FixedHeader,
  MaxWidthContainer,
  HeaderSpacer,
} from '~/ui/global/styled/layout'
import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import v from '~/utils/variables'

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

@inject('routingStore')
@observer
class AdminHeader extends React.Component {
  render() {
    const { routingStore } = this.props

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
                <StyledHeadingWrapper>Shape Admin</StyledHeadingWrapper>
              </Box>
            </Flex>
          </MaxWidthContainer>
        </FixedHeader>
        <HeaderSpacer />
      </Fragment>
    )
  }
}

AdminHeader.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminHeader
