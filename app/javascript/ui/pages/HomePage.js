import CollectionPage from '~/ui/pages/CollectionPage'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import backOutImage from '~/assets/back_out_of_new_org.png'

@inject('apiStore', 'uiStore')
@observer
class HomePage extends React.Component {
  async componentDidMount() {
    const { uiStore } = this.props
    const confirmed = await this.confirmNewOrganization()
    if (confirmed) {
      uiStore.openOrgCreateModal()
    } else {
      uiStore.closeDialog()
    }
  }

  confirmNewOrganization() {
    const { uiStore } = this.props
    return new Promise((resolve, reject) => {
      uiStore.confirm({
        options: [
          'Are you looking for your team? You may need to ask for an invitation.',
          'Create an organization and invite your team to get started!',
        ],
        image: backOutImage,
        confirmText: 'Create Organization',
        cancelText: 'Come back later',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
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
