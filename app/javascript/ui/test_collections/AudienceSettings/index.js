import _ from 'lodash'
import React from 'react'
// import { PropTypes } from 'prop-types'
import { computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable, toJS } from 'mobx'

import AudienceSettingsWidget from './AudienceSettingsWidget'
import TestAudience from '~/stores/jsonApi/TestAudience'

@inject('apiStore', 'networkStore', 'routingStore', 'uiStore')
@observer
class AudienceSettings extends React.Component {
  @observable
  audiences = []

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

  async hasPaymentMethod() {
    const { apiStore, networkStore } = this.props
    const organization = apiStore.currentUserOrganization
    await networkStore.loadPaymentMethods(organization.id)
  }

  addPaymentMethodModal() {
    const { apiStore, networkStore, routingStore, uiStore } = this.props
    // Will they always have a default payment method if they have at least one
    // payment method?
    const { defaultPaymentMethod } = networkStore
    if (!defaultPaymentMethod) {
      // The org admins should receive a different message than non-admins
      if (apiStore.currentUserOrganization.primary_group.can_edit) {
        const message =
          'Uh-oh! It looks like you don’t have an active payment method.'
        uiStore.confirm({
          prompt: message,
          confirmText: 'Add payment method',
          cancelText: '',
          onConfirm: () => routingStore.routeTo('billing'),
        })
      } else {
        const message =
          'Oops! your organization has not added a payment method yet. Ask your administrator to add a payment method to proceed.'
        uiStore.alert({
          prompt: message,
          confirmText: 'cancel',
          onConfirm: () => uiStore.closeDialog,
        })
      }
    }
  }

  onSubmitSettings = async () => {
    this.saveAllTestAudiences()
    const hasPaymentMethod = await this.hasPaymentMethod()
    if (!hasPaymentMethod) {
      this.addPaymentMethodModal()
    } else {
      // launch test
    }
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

  render() {
    return (
      <AudienceSettingsWidget
        onToggleCheckbox={this.onToggleCheckbox}
        handleKeyPress={this.handleKeyPress}
        onInputChange={this.onInputChange}
        onSubmitSettings={this.onSubmitSettings}
        totalPrice={this.totalPrice}
        audiences={this.audiences}
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
