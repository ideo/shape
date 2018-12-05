import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import EditableButton from '~/ui/reporting/EditableButton'
import trackError from '~/utils/trackError'

@inject('apiStore')
@observer
class TargetButton extends React.Component {
  async componentDidMount() {
    const { collectionFilter } = this
    if (collectionFilter) {
      try {
        await this.props.apiStore.fetch('collections', collectionFilter.target)
      } catch (e) {
        trackError(e)
      }
    }
  }

  get collectionFilter() {
    const { item } = this.props
    return (
      item.data_settings.d_filters &&
      item.data_settings.d_filters.find(x => x.type === 'Collection')
    )
  }

  render() {
    const { editable, onClick, apiStore } = this.props
    const { collectionFilter } = this
    let text = 'Organization'
    if (collectionFilter) {
      const collection = apiStore.find('collections', collectionFilter.target)
      if (collection) {
        text = collection.name
      }
    }

    return (
      <EditableButton editable={editable} onClick={onClick}>
        {text}
      </EditableButton>
    )
  }
}

TargetButton.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

TargetButton.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  editable: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
}

export default TargetButton
