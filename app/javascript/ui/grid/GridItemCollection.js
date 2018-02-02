import React from 'react'
// import PropTypes from 'prop-types'
// import _ from 'lodash'
import { Link } from 'react-router-dom'
import Button from 'material-ui/Button'
import Popover from 'material-ui/Popover'
import { MenuList, MenuItem } from 'material-ui/Menu'
import FontAwesome from 'react-fontawesome'

// import Shapes from '~/utils/Shapes'
import GridItemHotspots from '~/ui/grid/GridItemHotspots'

class GridItemCollection extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      anchorEl: null,
      menuOpen: false,
    }
  }

  controls = () => {
    let collectionActions = ''
    if (this.props.parentId) {
      collectionActions = (
        <MenuList>
          <MenuItem onClick={this.deleteCollection}>
            <FontAwesome name="trash" />
          </MenuItem>
        </MenuList>
      )
    }
    return (
      <div className="controls">
        <Button onClick={this.handleOpenMenu}>
          <FontAwesome name="ellipsis-v" />
        </Button>
        <Popover
          anchorEl={this.state.anchorEl}
          open={this.state.menuOpen}
          onClose={this.handleClose}
        >
          <div style={{ textAlign: 'right' }}>
            <Button mini color="accent" onClick={this.closeMenu}>
              close
            </Button>
          </div>
          {collectionActions}
        </Popover>
      </div>
    )
  }

  cover = () => {
    const { collection } = this.props
    const atom = collection.atoms().fetch()[0]
    if (atom && atom.imageUrl) {
      return <img src={atom.imageUrl} alt="atom" style={{ width: '100%' }} />
    }
    return ''
  }

  handleOpenMenu = (event) => {
    this.setState({ menuOpen: true, anchorEl: event.currentTarget })
  }

  closeMenu = () => {
    this.setState({ menuOpen: false })
    // const update = {
    //   field: 'size',
    //   value: this.state.itemSize
    // }
    // Meteor.call('updateItem', this.props.parentId, this.props.collection._id, update)
  }

  // Actions
  deleteCollection = () => {
    // Meteor.call('deleteCollection', this.props.parentId, this.props.collection._id)
  }

  render() {
    const { collection } = this.props
    return (
      <div className="GridItem">

        <div className="DragHandle" />
        <GridItemHotspots {...this.props} />
        {this.controls()}
        <div className="GridItem__inner">
          {/* <h1>{collection._id}</h1> */}
          <div className="name">
            <Link to={`/collections/${collection.slug}`}>
              {collection.name}
            </Link>
          </div>
          {this.cover()}
        </div>

      </div>
    )
  }
}

// GridItemCollection.propTypes = {
//   collection: PropTypes.shape(Shapes.COLLECTION).isRequired,
//   parentId: PropTypes.string.isRequired,
//   //
//   // connectDragSource: PropTypes.func.isRequired,
// }

export default GridItemCollection
