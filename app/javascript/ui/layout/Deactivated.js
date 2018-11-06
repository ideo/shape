import { inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { Link } from 'react-router-dom'
import PageContainer from '~/ui/layout/PageContainer'

@inject('apiStore')
class Deactivated extends React.Component {
  render() {
    const {
      apiStore: {
        currentUser: { current_organization: organization },
      },
    } = this.props
    return (
      <PageContainer>
        <div>logo</div>
        <div>The {organization.name} account has been closed.</div>
        {organization.primary_group.can_edit ? (
          <div>
            Go to the <Link to="/billing">billing page</Link> to reactivate the{' '}
            {organization.name} account.
          </div>
        ) : (
          <div>
            Contact your administrator to reopen the {organization.name}{' '}
            account.
          </div>
        )}
      </PageContainer>
    )
  }
}

Deactivated.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Deactivated
