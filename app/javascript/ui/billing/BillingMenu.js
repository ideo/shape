import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable } from 'mobx'
import { Fragment } from 'react'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'
import CloseSubtractIcon from '~/ui/icons/CloseSubtractIcon'
import apiSaveModel from '~/utils/apiSaveModel'
import trackError from '~/utils/trackError'

@inject('apiStore')
@observer
class BillingMenu extends React.Component {
  @observable
  open = false

  @observable
  confirm = false

  confirmDeactivate = () =>
    runInAction(() => {
      this.confirm = true
      this.open = false
    })

  confirmCancel = () => runInAction(() => (this.confirm = false))

  toggleOpen = () => runInAction(() => (this.open = !this.open))

  deactivateAccount = async () => {
    const organization = this.props.apiStore.currentUser.current_organization
    organization.deactivated = true
    try {
      await apiSaveModel(organization)
      runInAction(() => {
        this.alert = true
      })
    } catch (e) {
      trackError(e)
    }
  }

  menuItems() {
    return [
      {
        name: 'Close Account',
        iconRight: <CloseSubtractIcon />,
        onClick: this.confirmDeactivate,
      },
    ]
  }

  render() {
    const organization = this.props.apiStore.currentUserOrganization
    if (organization.deactivated) {
      return null
    }
    return (
      <Fragment>
        {this.confirm && (
          <ConfirmationDialog
            prompt={`Are you sure you want to close the ${
              organization.name
            } account? Once you cancel, nobody in ${
              organization.name
            } will be able to access content on Shape.`}
            onConfirm={this.deactivateAccount}
            onClose={this.confirmCancel}
            open="confirm"
            iconName="CloseSubtractGroup"
          />
        )}
        <PopoutMenu
          onClick={this.toggleOpen}
          menuOpen={this.open}
          menuItems={this.menuItems()}
        />
      </Fragment>
    )
  }
}

BillingMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default BillingMenu
