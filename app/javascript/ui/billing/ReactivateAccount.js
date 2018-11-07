import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable } from 'mobx'
import { Grid } from '@material-ui/core'
import styled from 'styled-components'
import Section from '~/ui/shared/components/molecules/Section'
import AlertDialog from '~/ui/global/modals/AlertDialog'
import Avatar from '~/ui/global/Avatar'
import apiSaveModel from '~/utils/apiSaveModel'
import trackError from '~/utils/trackError'
import v from '~/utils/variables'

const StyledHeader = styled.div`
  font-size: 24px;
  font-family: ${v.fonts.sans};
  text-transform: uppercase;
  font-weight: 500;
`

const StyledButton = styled.button`
  background: ${v.colors.black};
  color: ${v.colors.white};
  border-radius: 19.5px;
  padding: 10px 30px;
  font-family: ${v.fonts.sans};
  font-size: 16px;
  font-weight: 500;
  text-transform: uppercase;
`

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
    const organization = this.props.apiStore.currentUserOrganization
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
    if (!organization.deactivated) {
      return null
    }
    return (
      <Section>
        <Grid container justify="space-between" alignItems="center">
          <Grid item xs={1}>
            <Avatar url={organization.primary_group.filestack_file_url} />
          </Grid>
          <Grid item xs={7}>
            <StyledHeader>This account is closed.</StyledHeader>
          </Grid>
          <Grid item xs={4} container justify="flex-end">
            <Grid item>
              <StyledButton disabled={this.working} onClick={this.reactivate}>
                Reactivate Account
              </StyledButton>
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
