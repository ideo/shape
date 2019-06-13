import { PropTypes as MobxPropTypes } from 'mobx-react'
import Banner from '~/ui/layout/Banner'

class RespondentBanner extends React.Component {
  renderLeftComponent() {
    const earnings = parseFloat(this.user.current_incentive_balance).toFixed(2)
    return `You have earned $${earnings}.`
  }

  renderRightComponent() {
    return `You will receive your payment before ${this.user.incentive_due_date}.`
  }

  get user() {
    const { user } = this.props
    return user
  }

  get hideBanner() {
    return !this.user || this.user.current_incentive_balance < 1
  }

  render() {
    if (this.hideBanner) return ''

    return (
      <Banner
        leftComponent={this.renderLeftComponent()}
        rightComponent={this.renderRightComponent()}
      />
    )
  }
}

RespondentBanner.propTypes = {
  user: MobxPropTypes.objectOrObservableObject,
}

RespondentBanner.defaultProps = {
  user: null,
}
RespondentBanner.displayName = 'RespondentBanner'

export default RespondentBanner
