import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import Snackbar, { SnackbarContent } from 'material-ui/Snackbar'
import MoveArrowIcon from '~/ui/icons/MoveArrowIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledSnackbar = styled(Snackbar)`
  &.Snackbar {
    width: 100%;
    top: auto;
    max-width: 673px;
    margin-bottom: 35px;
    flex-grow: 1;
    color: white;
    background-color: transparent;
  }
`

const StyledSnackbarContent = styled(SnackbarContent)`
  &.SnackbarContent {
    background-color: ${v.colors.cloudy};
    max-width: none;
    padding: 15px 30px;
    width: 100%;
  }
`

// This text is different from other typography
const StyledMoveText = styled.span`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: ${v.weights.book};
  letter-spacing: 0.1rem;
  color: white;
`

const IconHolder = styled.span`
  margin-left: 40px;
  margin-top: 8px;
  width: 16px;
`

const CloseIconHolder = styled.span`
  margin-left: 60px;
  width: 16px;
`

@inject('uiStore')
@observer
class MoveModal extends React.Component {
  render() {
    const { uiStore } = this.props

    return (
      <div>
        { uiStore.moveMenuOpen && (
          <StyledSnackbar
            classes={{ root: 'Snackbar', }}
            open={uiStore.moveMenuOpen}
          >
            <StyledSnackbarContent
              classes={{ root: 'SnackbarContent', }}
              message={<StyledMoveText id="message-id">1 in transit</StyledMoveText>}
              action={[
                <IconHolder><button>
                  <MoveArrowIcon direction="up" />
                </button></IconHolder>,
                <IconHolder><button>
                  <MoveArrowIcon direction="down" />
                </button></IconHolder>,
                <CloseIconHolder><button><CloseIcon /></button></CloseIconHolder>,
              ]}
            />
          </StyledSnackbar>
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
