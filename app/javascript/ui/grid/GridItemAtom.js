import React from 'react'
// import PropTypes from 'prop-types'
// import _ from 'lodash'
// import Button from 'material-ui/Button'
// import Popover from 'material-ui/Popover'
// import { MenuList, MenuItem } from 'material-ui/Menu'
// import TextField from 'material-ui/TextField'
// import FontAwesome from 'react-fontawesome'

// import Shapes from '~/utils/Shapes'
import GridItemHotspots from '~/ui/grid/GridItemHotspots'

class GridItemAtom extends React.PureComponent {
  render() {
    const { atom } = this.props
    // const classNames = atom.imageUrl ? 'GridItem with-image' : 'GridItem'
    // const atomStyle = {}
    // if (atom.imageUrl) {
    //   atomStyle.backgroundImage = `url(${atom.imageUrl})`
    // }
    console.log(atom)

    return (
      <div>
        <GridItemHotspots {...this.props} />
        <div className="DragHandle" />
        {this.controls()}

        <div className="GridItem__inner">
          This is the atom
        </div>
      </div>
    )
  }
}

// GridItemAtom.propTypes = {
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
// GridItemAtom.defaultProps = {
//   pinned: false,
//   order: 99999
// }

export default GridItemAtom
