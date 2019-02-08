import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import askForInvitationImage from '~/assets/ask_for_invitation.png'
import createNewOrgImage from '~/assets/create_new_org.png'

@inject('apiStore', 'uiStore')
@observer
class HomePage extends React.Component {
  async componentDidMount() {
    const { uiStore } = this.props
    if (this.userHasOrg) return
    const confirmed = await this.confirmNewOrganization()
    if (confirmed) {
      uiStore.openOrgCreateModal()
    } else {
      uiStore.closeDialog()
      const { apiStore } = this.props
      apiStore.currentUser.logout()
    }
  }

  componentWillUnmount() {
    this.props.uiStore.closeDialog()
  }

  confirmNewOrganization() {
    const { uiStore } = this.props
    return new Promise((resolve, reject) => {
      uiStore.confirm({
        confirmImage: createNewOrgImage,
        confirmText: 'Create Organization',
        confirmPrompt:
          'Create an organization and invite your team to get started!',
        cancelImage: askForInvitationImage,
        cancelText: 'Come back later',
        cancelPrompt:
          'Are you looking for your team? You may need to ask for an invitation.',
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
    }
    return <div />
  }
}

HomePage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default HomePage
