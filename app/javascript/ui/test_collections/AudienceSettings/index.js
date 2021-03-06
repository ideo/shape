import _ from 'lodash'
import React, { Fragment } from 'react'
import styled from 'styled-components'
import { runInAction, observable, action, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Button from '~/ui/global/Button'
import { Heading3 } from '~/ui/global/styled/typography'
import AudienceSettingsWidget from '~/ui/test_collections/AudienceSettings/AudienceSettingsWidget'
import FeedbackTermsModal from '~/ui/test_collections/FeedbackTermsModal'
import ConfirmPriceModal from '~/ui/test_collections/ConfirmPriceModal'
import EditFeedbackButton from '~/ui/challenges/EditFeedbackButton'
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

const AudienceHeadingWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  /* align with submission format */
  width: 92%;
  padding-top: 10px;
`

@inject('apiStore', 'uiStore', 'routingStore')
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
  initAudienceSettings() {
    const { testCollection } = this.props
    const { audiences, audienceSettings } = this
    const { test_audiences, is_inside_a_challenge } = testCollection

    _.each(audiences, audience => {
      const testAudience = test_audiences.find(
        testAudience => testAudience.audience_id === audience.id
      )

      if (!testAudience) {
        return
      }

      const { isLinkSharing } = audience
      let selected = !!testAudience
      if ((testAudience && isLinkSharing) || is_inside_a_challenge) {
        selected = testAudience.status === 'open'
      }

      const displayCheckbox =
        selected ||
        isLinkSharing ||
        is_inside_a_challenge ||
        (!this.locked && audience.order <= 6)
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
    const { isLiveTest, isClosedTest } = testCollection
    if (testCollection.is_inside_a_challenge) {
      return testCollection.isTemplated
    }
    return isLiveTest || isClosedTest
  }

  get audiences() {
    const { apiStore, testCollection } = this.props
    const { audiences } = apiStore
    if (testCollection.is_inside_a_challenge) {
      // only show link sharing and challenge audiences for tests inside challenges
      return _.filter(audiences, audience => {
        return audience.isLinkSharing || audience.audience_type === 'challenge'
      })
    }

    return _.filter(audiences, audience => {
      return !audience.audience_type
    })
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
    const { testCollection } = this.props
    const { audienceSettings } = this
    const setting = audienceSettings.get(id)
    this.updateAudienceSetting(id, 'selected', !setting.selected)
    const { audience, test_audience } = setting
    if (
      testCollection.is_inside_a_challenge ||
      (!testCollection.is_inside_a_challenge && audience.isLinkSharing)
    ) {
      this.toggleTestAudience(audience, test_audience)
    }
  }

  async toggleTestAudience(audience, testAudience) {
    const open = testAudience.status === 'open'
    runInAction(() => {
      this.updateAudienceSetting(audience.id, 'selected', !open)
    })
    await testAudience.API_toggleAudienceStatus()
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
      testCollection.is_inside_a_challenge ||
      (!testCollection.collection_to_test_id &&
        !testCollection.is_submission_box_template_test)
    )
  }

  get showLaunchButton() {
    const { testCollection } = this.props

    // show audience settings by default for feedback inside challenges
    return (
      !testCollection.is_inside_a_challenge ||
      (testCollection.is_inside_a_challenge && this.viewingChallengeTest)
    )
  }

  get challengeName() {
    const { testCollection } = this.props

    return _.get(testCollection, 'challenge.name', 'Challenge')
  }

  get viewingChallengeTest() {
    const { testCollection, uiStore } = this.props

    return _.get(uiStore, 'viewingRecord.id') === testCollection.id
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

  handleAssignReviewers = () => {
    const { routingStore, uiStore, submissionBox } = this.props

    if (!submissionBox) return
    if (uiStore.challengeSettingsOpen) {
      uiStore.update('challengeSettingsOpen', false)
    }

    routingStore.routeTo('collections', submissionBox.id)

    runInAction(() => {
      submissionBox.submissions_collection.setViewMode('list')
    })
  }

  renderAudienceHeading() {
    const { uiStore, routingStore, testCollection } = this.props
    const { viewingChallengeTest } = this

    return (
      <AudienceHeadingWrapper>
        <Heading3>Feedback Audience</Heading3>
        {testCollection.is_inside_a_challenge && !viewingChallengeTest && (
          <EditFeedbackButton
            onClick={() => {
              uiStore.update('challengeSettingsOpen', false)
              routingStore.routeTo('collections', testCollection.id)
            }}
          />
        )}
      </AudienceHeadingWrapper>
    )
  }

  render() {
    const { uiStore, testCollection, apiStore, submissionBox } = this.props
    const { numPaidQuestions, is_inside_a_challenge } = testCollection
    const { currentUser } = apiStore
    const currentUserOrganization = currentUser.current_organization
    const { isLiveTest, isClosedTest } = testCollection

    return (
      <Fragment>
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
          <Fragment>
            {this.renderAudienceHeading()}
            <AudienceSettingsWidget
              onToggleCheckbox={this.onToggleCheckbox}
              onInputChange={this.onInputChange}
              totalPrice={this.totalPriceDollars}
              audiences={this.audiences}
              numPaidQuestions={numPaidQuestions}
              audienceSettings={this.audienceSettings}
              afterAddAudience={this.afterAddAudience}
              locked={this.locked}
              displayChallengeAudiences={is_inside_a_challenge}
              challengeName={this.challengeName}
              handleAssignReviewers={
                !submissionBox ? null : this.handleAssignReviewers
              }
            />
          </Fragment>
        )}
        {this.showLaunchButton && (
          <FormButtonWrapper>
            <Button
              data-cy="LaunchFormButton"
              disabled={
                uiStore.launchButtonLoading || isLiveTest || isClosedTest
              }
              onClick={this.submitSettings}
            >
              {testCollection.is_submission_box_template_test
                ? 'Launch Tests'
                : 'Get Feedback'}
            </Button>
          </FormButtonWrapper>
        )}
      </Fragment>
    )
  }
}

AudienceSettings.propTypes = {
  testCollection: MobxPropTypes.objectOrObservableObject.isRequired,
  submissionBox: MobxPropTypes.objectOrObservableObject,
}

AudienceSettings.defaultProps = {
  submissionBox: null,
}
AudienceSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

AudienceSettings.displayName = 'AudienceSettings'

export default AudienceSettings
