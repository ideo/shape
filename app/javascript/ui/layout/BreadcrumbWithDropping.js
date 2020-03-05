import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import WithDropTarget from '~/ui/global/WithDropTarget'

import BreadcrumbItem, {
  breadcrumbItemPropType,
} from '~/ui/layout/BreadcrumbItem'
import v from '~/utils/variables'

@observer
class BreadcrumbWithDropping extends React.Component {
  render() {
    const { currentlyDraggedOn } = this.props
    const showDrag =
      currentlyDraggedOn &&
      currentlyDraggedOn.item.identifier === this.props.item.identifier
    const backgroundColor = showDrag ? v.colors.primaryLight : null

    return <BreadcrumbItem {...this.props} backgroundColor={backgroundColor} />
  }
}

BreadcrumbWithDropping.propTypes = {
  item: PropTypes.shape(breadcrumbItemPropType).isRequired,
  currentlyDraggedOn: MobxPropTypes.objectOrObservableObject,
}

BreadcrumbWithDropping.defaultProps = {
  currentlyDraggedOn: null,
}

export default WithDropTarget(BreadcrumbWithDropping)
