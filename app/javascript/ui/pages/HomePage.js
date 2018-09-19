import CollectionPage from '~/ui/pages/CollectionPage'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

@inject('apiStore', 'uiStore')
@observer
class HomePage extends React.Component {
  componentDidMount() {
    if (this.userHasOrg) return
    const { uiStore } = this.props
    uiStore.openOrgCreateModal()
  }

  get userHasOrg() {
    const { apiStore } = this.props
    return !!apiStore.currentUserOrganizationId
  }

  render() {
    if (!this.userHasOrg) {
      // User needs to set up their Org...
      return <div />
    }
    return (
      // Otherwise Home just renders the CollectionPage
      <CollectionPage {...this.props} />
    )
  }
}

HomePage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default HomePage
