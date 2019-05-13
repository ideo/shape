import _ from 'lodash'
import React from 'react'
import { runInAction, observable, toJS, action, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import AudienceSettingsWidget from './AudienceSettingsWidget'
import TestAudience from '~/stores/jsonApi/TestAudience'
import FeedbackTermsModal from '../FeedbackTermsModal'
import ConfirmPriceModal from '../ConfirmPriceModal'
import { PaymentMethod } from '~shared/api.network.v1'

@inject('apiStore')
@observer
class AudienceSettings extends React.Component {
  @observable
  audiences = []
  @observable
  termsModalOpen = false
  @observable
  confirmPriceModalOpen = false

  constructor(props) {
    super(props)
    this.throttledSaveTestAudience = _.throttle(this.saveTestAudience, 2000)
  }

  componentDidMount() {
    this.fetchAvailableAudiences()
  }

  fetchAvailableAudiences = async () => {
    const { apiStore } = this.props

    const audiences = await apiStore.fetchOrganizationAudiences(
      apiStore.currentUserOrganizationId
    )
    runInAction(() => {
      this.audiences = audiences
    })
  }

  @computed
  get totalPrice() {
    const { audiences } = this
    return _.round(
      audiences
        .map(audience => {
          if (audience.currentSampleSize < 1) {
            return 0
          }
          return audience.currentSampleSize * audience.price_per_response
        })
        .reduce((acc, price) => price + acc, 0),
      2
    ).toFixed(2)
  }

  createTestAudience(audience) {
    const { apiStore, testCollection } = this.props
    const testAudienceData = {
      audience_id: audience.id,
      test_collection_id: testCollection.id,
      sample_size: 0,
    }
    return new TestAudience(toJS(testAudienceData), apiStore)
  }

  async saveTestAudience(audience) {
    await audience.currentTestAudience.save()
  }

  saveAllTestAudiences() {
    this.audiences.forEach(audience => {
      this.saveTestAudience(audience)
    })
  }

  onSubmitSettings = () => {
    this.saveAllTestAudiences()
  }

  onToggleCheckbox = e => {
    const { apiStore } = this.props
    const id = e.target.value
    const audience = apiStore.find('audiences', id)
    if (!audience.currentlySelected) {
      // If not yet selected, we have to create the test audience for this test
      // and temporarily attach it to the audience
      const testAudience = this.createTestAudience(audience)
      apiStore.add(testAudience)
    } else {
      apiStore.remove(audience.currentTestAudience)
    }
  }

  onInputChange = (audienceId, value) => {
    const { apiStore } = this.props
    const audience = apiStore.find('audiences', audienceId)
    runInAction(() => {
      audience.currentTestAudience.sample_size = value
    })
    this.throttledSaveTestAudience(audience)
  }

  handleKeyPress = event => {
    if (event.key === 'Enter') {
      this.throttledSaveTestAudience.flush()
    }
  }

  openTermsModal = () => runInAction(() => (this.termsModalOpen = true))

  closeTermsModal = () => runInAction(() => (this.termsModalOpen = false))

  @action
  openConfirmPriceModal = () => (this.confirmPriceModalOpen = true)

  @action
  closeConfirmPriceModal = () => {
    console.log('close confirm price')
    this.confirmPriceModalOpen = false
  }

  submitSettings = e => {
    e.preventDefault()
    const { apiStore } = this.props
    const currentUser = apiStore.currentUser
    // TODO: update size for test audiences
    // this.saveAllTestAudiences()
    if (currentUser.feedback_terms_accepted) {
      console.log('submitting settings')
      this.openConfirmPriceModal()
    } else {
      this.openTermsModal()
    }
  }

  acceptFeedbackTerms = e => {
    e.preventDefault()
    console.log('Agreeing to feedback terms')
    const { apiStore } = this.props
    const currentUser = apiStore.currentUser
    currentUser.API_acceptFeedbackTerms().finally(() => {
      runInAction(() => {
        this.termsModalOpen = false
        this.confirmPriceModalOpen = true
      })
    })
  }

  confirmPrice = e => {
    e.preventDefault()
    console.log('buying feedback')
    this.closeConfirmPriceModal()
    // TODO: Charge card for purchasing feedback audiences
  }

  render() {
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
          paymentMethod={{ last4: 1234, brand: 'Visa' }}
          price={'$100'}
          testName={'Your Cool Test'}
        />
        <AudienceSettingsWidget
          onToggleCheckbox={this.onToggleCheckbox}
          stopEditingIfContent={this.stopEditingIfContent}
          handleKeyPress={this.handleKeyPress}
          onInputChange={this.onInputChange}
          totalPrice={this.totalPrice}
          audiences={this.audiences}
          onSubmitSettings={this.submitSettings}
        />
      </React.Fragment>
    )
  }
}

AudienceSettings.propTypes = {}
AudienceSettings.propTypes = {
  testCollection: MobxPropTypes.objectOrObservableObject.isRequired,
}
AudienceSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AudienceSettings
