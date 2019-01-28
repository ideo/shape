import { inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import PageContainer from '~/ui/layout/PageContainer'
import Avatar from '~/ui/global/Avatar'
import v from '~/utils/variables'

const StyledAvatar = styled(Avatar)`
  && {
    margin: 0 auto 40px auto;
  }
`

const Wrapper = styled.div`
  text-align: center;
`

const StyledHeader = styled.div`
  font-size: 36px;
  font-family: ${v.fonts.sans};
  margin-bottom: 20px;
`

const StyledSubHeader = styled.div`
  font-size: 20px;
  font-family: ${v.fonts.sans};
  max-width: 400px;
  margin: 0 auto;
`

@inject('apiStore')
class Deactivated extends React.Component {
  render() {
    const {
      apiStore: { currentUserOrganization: organization },
    } = this.props
    if (!organization) return ''
    return (
      <PageContainer>
        <Wrapper>
          <StyledAvatar
            url={organization.primary_group.filestack_file_url}
            size={100}
          />
          <StyledHeader>
            The {organization.name} account has been closed.
          </StyledHeader>
          <StyledSubHeader>
            {organization.primary_group.can_edit ? (
              <div>
                Go to the <Link to="/billing">billing page</Link> to reactivate
                the {organization.name} account.
              </div>
            ) : (
              <div>
                Contact your administrator to reopen the {organization.name}{' '}
                account.
              </div>
            )}
          </StyledSubHeader>
        </Wrapper>
      </PageContainer>
    )
  }
}

Deactivated.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Deactivated
