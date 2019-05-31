import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import askForInvitationImage from '~/assets/ask_for_invitation.png'
import createNewOrgImage from '~/assets/create_new_org.png'

@inject('apiStore', 'uiStore')
@observer
class CreateOrgPage extends React.Component {
  componentDidMount() {
    if (this.userHasOrg) return
    this.confirmNewOrganization()
  }

  componentWillUnmount() {
    this.props.uiStore.closeDialog()
  }

  get userHasOrg() {
    const { apiStore } = this.props
    return !!apiStore.currentUserOrganizationId
  }

  onConfirm = () => {
    const { apiStore, uiStore, commonViewableResource } = this.props
    uiStore.openOrgCreateModal()
    if (commonViewableResource) {
      // this will actually happen after you've created your org
      uiStore.update('actionAfterRoute', () => {
        // viewing collection will be the user's My Collection at this point
        const { viewingCollection } = uiStore
        const data = {
          to_id: viewingCollection.id,
          from_id: viewingCollection.id,
          collection_card_ids: [
            commonViewableResource.parent_collection_card.id,
          ],
          placement: 'end',
        }
        apiStore.linkCards(data)
      })
    }
  }

  onCancel = () => {
    const { uiStore, apiStore } = this.props
    uiStore.closeDialog()
    apiStore.currentUser.logout()
  }

  confirmNewOrganization() {
    const { uiStore } = this.props
    uiStore.confirm({
      confirmImage: createNewOrgImage,
      confirmText: 'Create Organization',
      confirmPrompt:
        'Create an organization and invite your team to get started!',
      cancelImage: askForInvitationImage,
      cancelText: 'Come back later',
      cancelPrompt:
        'Are you looking for your team? You may need to ask for an invitation.',
      onConfirm: this.onConfirm,
      onCancel: this.onCancel,
      closeable: false,
    })
  }

  render() {
    // nothing to render, just popping up the confirmation dialog
    return <div />
  }
}

CreateOrgPage.propTypes = {
  commonViewableResource: MobxPropTypes.objectOrObservableObject,
}
CreateOrgPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CreateOrgPage.defaultProps = {
  commonViewableResource: null,
}

export default CreateOrgPage
