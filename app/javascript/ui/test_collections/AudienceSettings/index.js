import React from 'react'
// import { PropTypes } from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable, toJS } from 'mobx'

import AudienceSettingsWidget from './AudienceSettingsWidget'
import TestAudience from '~/stores//jsonApi/TestAudience'

@inject('apiStore')
@observer
class AudienceSettings extends React.Component {
  @observable
  audiences = []

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

  onToggleCheckbox = e => {
    const { apiStore } = this.props
    const id = e.target.value
    const audience = apiStore.find('audiences', id)
    if (!audience.currentlySelected) {
      // If not yet selected, we have to create the test audience for this test
      // and temporarily attach it to the audience
      const testAudience = this.createTestAudience(audience)
      runInAction(() => {
        audience.testAudience = testAudience
      })
    }
    runInAction(() => {
      audience.currentlySelected = !audience.currentlySelected
    })
  }

  stopEditingIfContent = () => {
    // AJAX call to set size for audience in database
  }

  handleKeyPress = event => {
    if (event.key === 'Enter') this.stopEditingIfContent()
  }

  onInputChange = (audienceId, value) => {
    const { apiStore } = this.props
    const audience = apiStore.find('audiences', audienceId)
    runInAction(() => {
      audience.testAudience.sample_size = value
    })
  }

  render() {
    return (
      <AudienceSettingsWidget
        onToggleCheckbox={this.onToggleCheckbox}
        stopEditingIfContent={this.stopEditingIfContent}
        handleKeyPress={this.handleKeyPress}
        onInputChange={this.onInputChange}
        totalPrice={this.totalPrice}
        options={this.audiences}
      />
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
