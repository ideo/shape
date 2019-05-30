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
import TestAudience from '~/stores/jsonApi/TestAudience'
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

    await apiStore.fetchOrganizationAudiences(
      apiStore.currentUserOrganizationId
    )
    this.updateAudienceSettings()
  }

  updateAudienceSettings() {
    const { testCollection } = this.props
    const audienceSettings = {}
    const { audiences } = this
    _.each(audiences, audience => {
      const testAudience = testCollection.test_audiences.find(
        testAudience => testAudience.audience_id.toString() === audience.id
      )
      audienceSettings[audience.id] = {
        selected: !!testAudience,
        sample_size: testAudience ? testAudience.sample_size : '0',
        audience: audience,
        test_audience: testAudience,
      }
    })
    runInAction(() => {
      this.audienceSettings = audienceSettings
    })
  }

  @computed
  get locked() {
    const { testCollection } = this.props
    return testCollection.is_test_locked
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

  onToggleCheckbox = async e => {
    const id = e.target.value
    const { audienceSettings } = this
    runInAction(() => {
      audienceSettings[id].selected = !audienceSettings[id].selected
    })
    const { audience, test_audience } = audienceSettings[id]
    if (this.locked && audience.price_per_response === 0) {
      this.toggleLinkSharing(audience, test_audience)
    }
  }

  async toggleLinkSharing(audience, testAudience) {
    const { apiStore, testCollection } = this.props
    const testDesign = testCollection
    if (testAudience) {
      runInAction(() => {
        _.remove(testDesign.test_audiences, tA => tA.id === testAudience.id)
      })
      await testAudience.destroy()
      this.updateAudienceSettings()
    } else {
      const testAudience = new TestAudience(
        {
          test_collection_id: testDesign.test_collection_id,
          audience_id: audience.id,
          price_per_response: 0,
        },
        apiStore
      )
      await testAudience.save()
      await testDesign.refetch()
      runInAction(() => {
        testDesign.test_audiences.push(testAudience)
      })
      this.updateAudienceSettings()
    }
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
            locked={this.locked}
          />
        )}
        <FormButtonWrapper>
          <FormButton
            data-cy="LaunchFormButton"
            disabled={uiStore.launchButtonLoading || this.locked}
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
