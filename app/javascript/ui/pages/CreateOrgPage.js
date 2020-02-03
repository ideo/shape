import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

@inject('apiStore', 'uiStore')
@observer
class CreateOrgPage extends React.Component {
  componentDidMount() {
    const { uiStore } = this.props
    if (this.userHasOrg) return
    uiStore.openOrgCreateModal()
  }

  componentWillUnmount() {
    this.props.uiStore.closeDialog()
  }

  get userHasOrg() {
    const { apiStore } = this.props
    return !!apiStore.currentUserOrganizationId
  }

  render() {
    // nothing to render, just popping up the confirmation dialog
    return <div />
  }
}

CreateOrgPage.propTypes = {
  commonViewableResource: MobxPropTypes.objectOrObservableObject,
}
CreateOrgPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CreateOrgPage.defaultProps = {
  commonViewableResource: null,
}

export default CreateOrgPage
