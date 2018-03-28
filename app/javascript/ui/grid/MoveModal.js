import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import AppBar from 'material-ui/AppBar';

const StyledAppBar = styled(AppBar)`
  &.appBar {
    width: 100%;
    top: auto;
    padding: 22px 30px;
    right: calc(50% - 340px);
    max-width: 680px;
    height: 60px;
    flex-grow: 1;
    color: white;
    bottom: 65px;
    background-color: #a89f9b;
  }
`

@inject('uiStore')
@observer
class MoveModal extends React.Component {
  render() {
    const { uiStore } = this.props

    return (
      <div>
        { uiStore.moveMenuOpen && (
          <StyledAppBar
            classes={{ root: 'appBar' }}
            position="fixed"
            open={uiStore.moveMenuOpen}
          >
            Hellow
          </StyledAppBar>
        )}
      </div>
    )
  }
}

MoveModal.propTypes = {
}
MoveModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
MoveModal.defaultProps = {
}

export default MoveModal
