import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable } from 'mobx'
import { Grid } from '@material-ui/core'
import Section from '~/ui/shared/components/molecules/Section'
import AlertDialog from '~/ui/global/modals/AlertDialog'
import apiSaveModel from '~/utils/apiSaveModel'
import trackError from '~/utils/trackError'

@inject('apiStore')
@observer
class ReactivateAccount extends React.Component {
  @observable
  alert = false

  @observable
  working = false

  reactivate = async () => {
    runInAction(() => (this.working = true))
    const organization = this.props.apiStore.currentUser.current_organization
    organization.deactivated = false
    try {
      await apiSaveModel(organization)
      runInAction(() => {
        this.working = false
        this.alert = true
      })
    } catch (e) {
      trackError(e)
      runInAction(() => (this.working = false))
    }
  }

  render() {
    const {
      apiStore: {
        currentUser: {
          current_organization: { deactivated },
        },
      },
    } = this.props
    if (this.alert) {
      return (
        <AlertDialog
          prompt="Your account has been reactivated!"
          open="info"
          onClose={() => runInAction(() => (this.alert = false))}
          iconName="Celebrate"
        />
      )
    }
    if (!deactivated) {
      return null
    }
    return (
      <Section>
        <Grid container justify="space-between">
          <Grid item xs={1}>
            logo
          </Grid>
          <Grid item xs={7}>
            This account is closed.
          </Grid>
          <Grid item xs={3} container justify="flex-end">
            <Grid item>
              <button disabled={this.working} onClick={this.reactivate}>
                Reactivate Account?
              </button>
            </Grid>
          </Grid>
        </Grid>
      </Section>
    )
  }
}

ReactivateAccount.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ReactivateAccount
