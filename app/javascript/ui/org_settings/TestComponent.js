import { observer, PropTypes } from 'mobx-react'
import { businessUnitsStore } from './creativeDifferenceApis/BusinessUnitsCollection'

@observer
class TestComponent extends React.Component {
  onClick(e) {
    console.log(this.props.businessUnit)
    console.log('clicked button:', e)
    this.props.businessUnit.save(
      {
        industry_subcategory_id:
          this.props.businessUnit.get('industry_subcategory_id') + 1,
      },
      { optimistic: false }
    )
  }

  render() {
    console.log('rendering test component')
    return (
      <li key={this.props.businessUnit.id}>
        <button onClick={this.onClick.bind(this)}>
          increment {this.props.businessUnit.get('industry_subcategory_id')}
        </button>
        {this.props.businessUnit.get('name')}
      </li>
    )
  }
}

TestComponent.propTypes = {
  businessUnit: PropTypes.objectOrObservableObject,
}

export default TestComponent
