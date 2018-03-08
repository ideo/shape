import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

@observer
class OrganizationEdit extends React.Component {
  render() {
    const { organization } = this.props
    return (
      <div>{ organization.name }</div>
    )
  }
}

OrganizationEdit.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
}

// apply the wrapper here so that it doesn't interfere with propType definition
export default OrganizationEdit
