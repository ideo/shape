import React from 'react'
// import { PropTypes } from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import AudienceSettingsWidget from './presentation'

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
    console.log('here', audiences)
    runInAction(() => {
      this.audences = audiences
    })
  }

  get totalPrice() {
    const { audiences } = this
    return audiences
      .map(option => {
        if (option.size < 1) {
          return 0
        }
        return option.size * option.pricePerResponse
      })
      .reduce((acc, price) => price + acc, 0)
  }

  toggleCheckbox = e => {
    const { audiences } = this
    const id = e.target.value
    const foundOption = audiences.find(option => option.id === id)
    const updatedOption = Object.assign({}, foundOption, {
      selected: !foundOption.selected,
    })
    const newaudiences = this.audiences.map(
      option => (option.id === id ? updatedOption : option)
    )
    runInAction(() => {
      this.audences = newaudiences
    })
  }

  stopEditingIfContent = () => {
    console.log('foo')
    // AJAX call to set size for audience in database
  }
  handleKeyPress = event => {
    if (event.key === 'Enter') this.stopEditingIfContent()
  }
  handleInputChange = e => {
    console.log(e.target)
    // let input component handle its own state and pass data back up?
  }

  render() {
    return (
      <AudienceSettingsWidget
        toggleCheckbox={this.toggleCheckbox}
        stopEditingIfContent={this.stopEditingIfContent}
        handleKeyPress={this.handleKeyPress}
        handleInputChange={this.handleInputChange}
        totalPrice={this.totalPrice}
        options={this.audiences}
      />
    )
  }
}

AudienceSettings.propTypes = {}
AudienceSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AudienceSettings
