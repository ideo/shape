import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import MoveHelperModal from '~/ui/users/MoveHelperModal'
import MoveSnackbar from '~/ui/grid/MoveSnackbar'

@inject('uiStore', 'apiStore')
@observer
class GlobalPageComponentsContainer extends React.Component {
  // contains components used for page navigation, tutorial, etc
  // ie: modals, snackbars, etc.

  render() {
    const { uiStore, apiStore, pastingCards } = this.props
    if (
      uiStore.showTemplateHelperForCollection &&
      apiStore.currentUser.show_template_helper
    ) {
      return <MoveHelperModal type="template" />
    }
    const children = []
    if (
      apiStore.currentUser.show_move_helper &&
      uiStore.cardAction === 'move'
    ) {
      children.push(<MoveHelperModal type="move" key="moveHelperModal" />)
    }

    if (uiStore.shouldOpenMoveSnackbar) {
      children.push(
        <MoveSnackbar pastingCards={pastingCards} key="moveSnackbar" />
      )
    }

    return <div>{children}</div>
  }
}

GlobalPageComponentsContainer.propTypes = {
  pastingCards: PropTypes.bool.isRequired,
}

GlobalPageComponentsContainer.defaultProps = {
  pastingCards: false,
}

GlobalPageComponentsContainer.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GlobalPageComponentsContainer
