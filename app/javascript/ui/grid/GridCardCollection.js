// import PropTypes from 'prop-types'
// import _ from 'lodash'
// import Button from 'material-ui/Button'
// import Popover from 'material-ui/Popover'
// import { MenuList, MenuItem } from 'material-ui/Menu'
// import TextField from 'material-ui/TextField'
// import FontAwesome from 'react-fontawesome'

// import Shapes from '~/utils/Shapes'
import GridCardHotspots from '~/ui/grid/GridCardHotspots'

class GridCardCollection extends React.PureComponent {
  render() {
    const { record } = this.props
    // const classNames = atom.imageUrl ? 'GridItem with-image' : 'GridItem'
    // const atomStyle = {}
    // if (atom.imageUrl) {
    //   atomStyle.backgroundImage = `url(${atom.imageUrl})`
    // }
    // console.log(record)

    return (
      <div>
        <GridCardHotspots {...this.props} />
        <div className="DragHandle" />
        {/* {this.controls()} */}

        <div className="GridItem__inner">
          (subcollection) <br />
          { record.name }
        </div>
      </div>
    )
  }
}

// GridCardCollection.propTypes = {
//   atom: PropTypes.shape(Shapes.ATOM).isRequired,
//   parentId: PropTypes.string.isRequired,
//   order: PropTypes.number,
//   w: PropTypes.number.isRequired,
//   h: PropTypes.number.isRequired,
//   pinned: PropTypes.bool,
//   //
//   // connectDragSource: PropTypes.func.isRequired,
// }
//
// GridCardCollection.defaultProps = {
//   pinned: false,
//   order: 99999
// }

export default GridCardCollection
