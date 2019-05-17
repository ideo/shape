import _ from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { runInAction, observable, action, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { FormButton } from '~/ui/global/styled/forms'
import AudienceSettingsWidget from './AudienceSettingsWidget'
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

  // createTestAudience(audience) {
  //   const { apiStore, testCollection } = this.props
  //   const testAudienceData = {
  //     audience_id: audience.id,
  //     test_collection_id: testCollection.id,
  //     sample_size: 0,
  //   }
  //   return new TestAudience(toJS(testAudienceData), apiStore)
  // }
  //
  // async saveTestAudience(audience) {
  //   await audience.currentTestAudience.save()
  // }
  //
  // saveAllTestAudiences() {
  //   this.audiences.forEach(audience => {
  //     this.saveTestAudience(audience)
  //   })
  // }
  //
  // onSubmitSettings = () => {
  //   this.saveAllTestAudiences()
  // }

  onToggleCheckbox = e => {
    // const { apiStore } = this.props
    const id = e.target.value
    // const audience = apiStore.find('audiences', id)
    // if (!audience.currentlySelected) {
    //   // If not yet selected, we have to create the test audience for this test
    //   // and temporarily attach it to the audience
    //   const testAudience = this.createTestAudience(audience)
    //   apiStore.add(testAudience)
    // } else {
    //   apiStore.remove(audience.currentTestAudience)
    // }
    runInAction(() => {
      const { audienceSettings } = this
      audienceSettings[id].selected = !audienceSettings[id].selected
    })
  }

  onInputChange = (audienceId, value) => {
    // const { apiStore } = this.props
    // const audience = apiStore.find('audiences', audienceId)
    const { audienceSettings } = this
    runInAction(() => {
      audienceSettings[audienceId].sample_size = value
    })
    // this.throttledSaveTestAudience(audience)
  }

  // handleKeyPress = event => {
  //   if (event.key === 'Enter') {
  //     this.throttledSaveTestAudience.flush()
  //   }
  // }

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

  submitSettings = e => {
    e.preventDefault()
    const { apiStore } = this.props
    const { currentUser } = apiStore
    if (currentUser.feedback_terms_accepted) {
      console.log('submitting settings')
      if (this.totalPrice === 0) {
        this.launchTestWithAudienceSettings()
      } else {
        this.openConfirmPriceModal()
      }
    } else {
      this.openTermsModal()
    }
  }

  acceptFeedbackTerms = e => {
    e.preventDefault()
    console.log('Agreeing to feedback terms')
    const { currentUser } = this.props.apiStore
    currentUser.API_acceptFeedbackTerms().finally(() => {
      this.closeTermsModal()
      this.openConfirmPriceModal()
    })
  }

  confirmPrice = e => {
    e.preventDefault()
    console.log('buying feedback')
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
            disabled={uiStore.launchButtonLoading}
            onClick={this.submitSettings}
          >
            Get Feedback
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
