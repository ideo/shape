import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import EditableButton from '~/ui/reporting/EditableButton'

@observer
class DataTargetButton extends React.Component {
  get buttonText() {
    const { targetCollection } = this.props
    if (targetCollection) {
      return targetCollection.name
    }
    return 'Organization'
  }

  render() {
    const { editable, onClick } = this.props

    return (
      <EditableButton editable={editable} onClick={onClick}>
        {this.buttonText}
      </EditableButton>
    )
  }
}

DataTargetButton.propTypes = {
  targetCollection: MobxPropTypes.objectOrObservableObject,
  editable: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
}
DataTargetButton.defaultProps = {
  targetCollection: null,
  editable: false,
}

export default DataTargetButton
