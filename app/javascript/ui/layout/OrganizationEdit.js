import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

@observer
class OrganizationEdit extends React.Component {
  componentDidMount() {
    this.changeName(this.props.organization.name)
  }

  @observable organizationName = ''

  handleNameChange = (ev) => {
    this.changeName(ev.target.value)
  }

  @action
  changeName(value) {
    this.organizationName = value
  }

  handleSave = (ev) => {
    ev.preventDefault()
    const { organization } = this.props
    organization.name = this.organizationName
    organization.save()
  }

  render() {
    return (
      <form>
        <input
          type="text"
          value={this.organizationName}
          onChange={this.handleNameChange}
        />
        <input
          onClick={this.handleSave}
          type="submit"
          value="save"
        />
      </form>
    )
  }
}

OrganizationEdit.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationEdit
