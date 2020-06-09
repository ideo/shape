import _ from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { runInAction, observable, action, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Button from '~/ui/global/Button'
import AudienceSettingsWidget from '~/ui/test_collections/AudienceSettings/AudienceSettingsWidget'
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
  @observable
  errors = null

  componentDidMount() {
    this.fetchAvailableAudiences()
  }

  fetchAvailableAudiences = async () => {
    const { apiStore } = this.props

    await apiStore.fetchOrganizationAudiences(
      apiStore.currentUserOrganizationId
    )
    this.initAudienceSettings()
  }

  @action
  async initAudienceSettings() {
    const { testCollection } = this.props
    const { audiences, audienceSettings } = this
    const { test_audiences } = testCollection

    _.each(audiences, audience => {
      const testAudience = test_audiences.find(
        testAudience => testAudience.audience_id === audience.id
      )

      const { isLinkSharing, audience_type } = audience
      let selected = !!testAudience
      if (testAudience && isLinkSharing) {
        selected = testAudience.status === 'open'
      } else if (testCollection.isInsideAChallenge) {
        if (audience_type === 'challenge') {
          audienceSettings.set(audience.id, {
            selected: false,
            audience: testAudience,
            displayCheckbox: true,
          })
        }
        // NOTE: return early to not display org-wide audiences
        return
      }

      const displayCheckbox =
        selected || isLinkSharing || (!this.locked && audience.order <= 6)
      audienceSettings.set(audience.id, {
        selected,
        sample_size: testAudience ? testAudience.sample_size : '0',
        audience,
        test_audience: testAudience,
        displayCheckbox,
      })
    })
  }

  @computed
  get locked() {
    const { testCollection } = this.props
    return testCollection.isLiveTest || testCollection.isClosedTest
  }

  @computed
  get audiences() {
    const { apiStore } = this.props
    return apiStore.findAll('audiences')
  }

  @computed
  get totalPrice() {
    const { audiences, audienceSettings } = this
    const {
      testCollection: { numPaidQuestions },
    } = this.props
    if (!this.showAudienceSettings) return 0
    return _.round(
      audiences
        .map(audience => {
          const setting = audienceSettings.get(audience.id)
          if (!setting || !setting.selected) return 0
          const sampleSize = setting.sample_size
            ? parseInt(setting.sample_size)
            : 0
          return sampleSize * audience.pricePerResponse(numPaidQuestions)
        })
        .reduce((acc, price) => price + acc, 0),
      2
    )
  }

  get totalPriceDollars() {
    return `$${this.totalPrice.toFixed(2)}`
  }

  @action
  updateAudienceSetting(audienceId, key, value) {
    const { audienceSettings } = this
    const setting = audienceSettings.get(audienceId)
    setting[key] = value
    audienceSettings.set(audienceId, setting)
  }

  onToggleCheckbox = async e => {
    const id = e.target.value
    const { audienceSettings } = this
    const setting = audienceSettings.get(id)
    this.updateAudienceSetting(id, 'selected', !setting.selected)
    const { audience, test_audience } = setting
    if (audience.isLinkSharing) {
      this.toggleLinkSharing(audience, test_audience)
    }
  }

  async toggleLinkSharing(audience, testAudience) {
    let open = testAudience.status === 'open'
    runInAction(() => {
      testAudience.status = open ? 'closed' : 'open'
      open = !open
      this.updateAudienceSetting(audience.id, 'selected', open)
    })
    await testAudience.patch()
  }

  onInputChange = (audienceId, value) => {
    this.updateAudienceSetting(audienceId, 'sample_size', value)
  }

  @action
  openTermsModal = () => (this.termsModalOpen = true)

  @action
  closeTermsModal = () => (this.termsModalOpen = false)

  @action
  openConfirmPriceModal = () => (this.confirmPriceModalOpen = true)

  @action
  closeConfirmPriceModal = () => (this.confirmPriceModalOpen = false)

  async isReadyToLaunch() {
    const { testCollection, apiStore } = this.props

    try {
      await apiStore.request(
        `test_collections/${testCollection.launchableTestId}/validate_launch`
      )
      return true
    } catch (err) {
      return false
    }
  }

  async confirmOrLaunchTest() {
    const { testCollection } = this.props
    const readyToLaunch = await testCollection.API_validateLaunch()
    if (!readyToLaunch) {
      return
    }
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

    // show audience settings by default for feedback inside challenges
    return (
      testCollection.isInsideAChallenge ||
      (!testCollection.collection_to_test_id &&
        !testCollection.is_submission_box_template_test)
    )
  }

  get challengeName() {
    const { testCollection } = this.props

    return _.get(testCollection, 'challenge.name', 'Challenge')
  }

  afterAddAudience = audience => {
    const { audienceSettings } = this
    runInAction(() => {
      audienceSettings.set(audience.id, {
        selected: true,
        sample_size: '0',
        audience,
        test_audience: null,
        displayCheckbox: true,
      })
    })
  }

  render() {
    const { uiStore, testCollection } = this.props
    const { apiStore } = this.props
    const { numPaidQuestions } = testCollection
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
            numPaidQuestions={numPaidQuestions}
            audienceSettings={this.audienceSettings}
            afterAddAudience={this.afterAddAudience}
            locked={this.locked}
            displayChallengeAudiences={testCollection.isInsideAChallenge}
            challengeName={this.challengeName}
          />
        )}
        <FormButtonWrapper>
          <Button
            data-cy="LaunchFormButton"
            disabled={uiStore.launchButtonLoading || this.locked}
            onClick={this.submitSettings}
          >
            {testCollection.is_submission_box_template_test
              ? 'Launch Tests'
              : 'Get Feedback'}
          </Button>
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
