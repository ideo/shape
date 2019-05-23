import _ from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { runInAction, observable, action, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { FormButton } from '~/ui/global/styled/forms'
import AudienceSettingsWidget from '~/ui/test_collections/AudienceSettings/AudienceSettingsWidget'
// import TestAudience from '~/stores/jsonApi/TestAudience'
import FeedbackTermsModal from '~/ui/test_collections/FeedbackTermsModal'
import ConfirmPriceModal from '~/ui/test_collections/ConfirmPriceModal'
import v from '~/utils/variables'

const FormButtonWrapper = styled.div`
  margin: 2rem;
  display: flex;
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
    button {
      margin-left: auto;
    }
  }
`

@inject('apiStore', 'uiStore')
@observer
class AudienceSettings extends React.Component {
  @observable
  termsModalOpen = false
  @observable
  confirmPriceModalOpen = false
  @observable
  audienceSettings = new Map()

  componentDidMount() {
    this.fetchAvailableAudiences()
  }

  fetchAvailableAudiences = async () => {
    const { apiStore } = this.props

    const audiences = await apiStore.fetchOrganizationAudiences(
      apiStore.currentUserOrganizationId
    )
    const audienceSettings = {}
    _.each(audiences, audience => {
      audienceSettings[audience.id] = {
        selected: false,
        sample_size: '0',
      }
    })
    this.updateAudienceSettings(audienceSettings)
  }

  @computed
  get audiences() {
    const { apiStore } = this.props
    return apiStore.findAll('audiences')
  }

  @computed
  get totalPrice() {
    const { audiences, audienceSettings } = this
    if (!this.showAudienceSettings) return 0
    return _.round(
      audiences
        .map(audience => {
          const setting = audienceSettings[audience.id]
          if (!setting || !setting.selected) return 0
          const sampleSize = setting.sample_size
            ? parseInt(setting.sample_size)
            : 0
          return sampleSize * audience.price_per_response
        })
        .reduce((acc, price) => price + acc, 0),
      2
    )
  }

  get totalPriceDollars() {
    return `$${this.totalPrice.toFixed(2)}`
  }

  onToggleCheckbox = e => {
    const id = e.target.value
    runInAction(() => {
      const { audienceSettings } = this
      audienceSettings[id].selected = !audienceSettings[id].selected
    })
  }

  onInputChange = (audienceId, value) => {
    const { audienceSettings } = this
    runInAction(() => {
      audienceSettings[audienceId].sample_size = value
    })
  }

  @action
  openTermsModal = () => (this.termsModalOpen = true)

  @action
  closeTermsModal = () => (this.termsModalOpen = false)

  @action
  openConfirmPriceModal = () => (this.confirmPriceModalOpen = true)

  @action
  closeConfirmPriceModal = () => (this.confirmPriceModalOpen = false)

  @action
  updateAudienceSettings = settings => (this.audienceSettings = settings)

  confirmOrLaunchTest() {
    if (this.totalPrice === 0) {
      this.launchTestWithAudienceSettings()
    } else {
      this.openConfirmPriceModal()
    }
  }

  submitSettings = e => {
    e.preventDefault()
    const { apiStore } = this.props
    const { currentUser } = apiStore
    if (currentUser.feedback_terms_accepted) {
      this.confirmOrLaunchTest()
    } else {
      this.openTermsModal()
    }
  }

  acceptFeedbackTerms = e => {
    e.preventDefault()
    const { currentUser } = this.props.apiStore
    currentUser.API_acceptFeedbackTerms().finally(() => {
      this.closeTermsModal()
      this.confirmOrLaunchTest()
    })
  }

  confirmPrice = e => {
    e.preventDefault()
    this.closeConfirmPriceModal()
    this.launchTestWithAudienceSettings()
  }

  launchTestWithAudienceSettings() {
    const { testCollection } = this.props
    testCollection.launchTest(
      this.showAudienceSettings ? this.audienceSettings : null
    )
  }

  get showAudienceSettings() {
    const { testCollection } = this.props
    return (
      !testCollection.collection_to_test_id &&
      !testCollection.is_submission_box_template_test
    )
  }

  render() {
    const { uiStore, testCollection } = this.props
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const currentUserOrganization = currentUser.current_organization

    return (
      <React.Fragment>
        <FeedbackTermsModal
          open={!!this.termsModalOpen}
          onSubmit={this.acceptFeedbackTerms}
          close={this.closeTermsModal}
        />
        <ConfirmPriceModal
          open={!!this.confirmPriceModalOpen}
          onSubmit={this.confirmPrice}
          close={this.closeConfirmPriceModal}
          // TODO: pull in the real payment method from the network (brand / last4)
          paymentMethod={null}
          organization={currentUserOrganization}
          totalPrice={this.totalPriceDollars}
          testName={testCollection.name}
        />
        {this.showAudienceSettings && (
          <AudienceSettingsWidget
            onToggleCheckbox={this.onToggleCheckbox}
            onInputChange={this.onInputChange}
            totalPrice={this.totalPriceDollars}
            audiences={this.audiences}
            audienceSettings={this.audienceSettings}
          />
        )}
        <FormButtonWrapper>
          <FormButton
            data-cy="LaunchFormButton"
            disabled={uiStore.launchButtonLoading}
            onClick={this.submitSettings}
          >
            {testCollection.is_submission_box_template_test
              ? 'Launch Tests'
              : 'Get Feedback'}
          </FormButton>
        </FormButtonWrapper>
      </React.Fragment>
    )
  }
}

AudienceSettings.propTypes = {
  testCollection: MobxPropTypes.objectOrObservableObject.isRequired,
}
AudienceSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AudienceSettings
