import React from 'react'
// import { PropTypes } from 'prop-types'
import AudienceSettingsWidget from './presentation'

class AudienceSettings extends React.Component {
  state = {
    options: [],
  }

  componentDidMount() {
    this.setState({
      options: this.options,
    })
  }

  fetchOptions = () => {
    console.log('TODO: implement fetchOptions')
  }

  get options() {
    this.fetchOptions()
    // eventually this will be an API call to fetch audiences
    return [
      {
        id: '1',
        label: 'Share via link (on)',
        size: null,
        disabled: true,
        selected: true,
        hasInput: false,
      },
      {
        id: '2',
        label: 'All People (No Filters)',
        size: 12,
        disabled: false,
        selected: false,
        hasInput: true,
        pricePerResponse: 5.12,
      },
      {
        id: '3',
        label: 'My new option',
        size: 12,
        disabled: false,
        selected: false,
        hasInput: true,
        pricePerResponse: 3.77,
      },
    ]
  }

  get totalPrice() {
    const { options } = this.state
    return options
      .map(option => {
        if (option.size < 1) {
          return 0
        }
        return option.size * option.pricePerResponse
      })
      .reduce((acc, price) => price + acc, 0)
  }

  toggleCheckbox = e => {
    const { options } = this.state
    const id = e.target.value
    const foundOption = options.find(option => option.id === id)
    const updatedOption = Object.assign({}, foundOption, {
      selected: !foundOption.selected,
    })
    console.log('updating option: ', updatedOption)
    const newOptions = this.state.options.map(
      option => (option.id === id ? updatedOption : option)
    )
    this.setState({ options: newOptions })
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
        options={this.state.options}
      />
    )
  }
}

AudienceSettings.propTypes = {}

export default AudienceSettings
