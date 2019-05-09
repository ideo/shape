import _ from 'lodash'
import React from 'react'
import { computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable, toJS } from 'mobx'

import AudienceSettingsWidget from './AudienceSettingsWidget'
import TestAudience from '~/stores/jsonApi/TestAudience'
import FeedbackTermsModal from '../FeedbackTermsModal'
// Need to replace with actual asset => how to add to AWS?
import PaperAirplane from '../PaperAirplane'
import { FormButton } from '~/ui/global/styled/forms'
import { Heading1, DisplayText } from '~/ui/global/styled/typography'

@inject('apiStore')
@observer
class AudienceSettings extends React.Component {
  @observable
  audiences = []
  showModal = false

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

  handleKeyPress = event => {
    if (event.key === 'Enter') {
      // this.throttledSaveTestAudience.flush()
    }
  }

  onInputChange = (audienceId, value) => {
    const { apiStore } = this.props
    const audience = apiStore.find('audiences', audienceId)
    runInAction(() => {
      audience.currentTestAudience.sample_size = value
    })
    // this.throttledSaveTestAudience(audience)
  }

  render() {
    return (
      <React.Fragment>
        <FeedbackTermsModal>
          <PaperAirplane />
          <Heading1>
            Before you launch your first test, please review and agree to the
            terms below.
          </Heading1>
          <DisplayText>
            Shape is a creative platform which allows its users to test its
            ideas, including capturing digital research by distributing surveys
            to people of interest. Shape is not responsible for and does not
            have any insight into the contents of the surveys created by its
            users, but those users are required to comply with Shape’s Terms of
            Use. If you believe one of our users is breaching our Terms of Use,
            please <a href="mailto:help@shape.space">contact us</a>.
          </DisplayText>
          <div />
          <FormButton width={300}>I agree to these terms</FormButton>
        </FeedbackTermsModal>
        <AudienceSettingsWidget
          onToggleCheckbox={this.onToggleCheckbox}
          stopEditingIfContent={this.stopEditingIfContent}
          handleKeyPress={this.handleKeyPress}
          onInputChange={this.onInputChange}
          totalPrice={this.totalPrice}
          audiences={this.audiences}
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
