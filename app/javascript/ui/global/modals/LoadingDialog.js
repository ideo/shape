import PropTypes from 'prop-types'

import v from '~/utils/variables'
import Dialog from './Dialog'

class LoadingDialog extends React.PureComponent {
  get isOpen() {
    return this.props.open === 'loading'
  }

  render() {
    const { open, prompt } = this.props
    if (open !== 'loading') return null
    const modalProps = {
      ...this.props,
      onClose: null,
      open: this.isOpen,
    }

    return (
      <Dialog
        {...modalProps}
        backgroundColor={v.colors.white}
        maxWidth="md"
        overrideWithLoader
      >
        <div>
          <p>{prompt}</p>
        </div>
      </Dialog>
    )
  }
}

LoadingDialog.propTypes = {
  ...Dialog.childPropTypes,
  prompt: PropTypes.string,
  open: PropTypes.string,
  iconName: PropTypes.string,
  fadeOutTime: PropTypes.number,
}
LoadingDialog.defaultProps = {
  ...Dialog.defaultProps,
  prompt: '',
  open: '',
  iconName: 'Info',
  fadeOutTime: 4000,
}

export default LoadingDialog
