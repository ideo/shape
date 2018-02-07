import React from 'react'
import PropTypes from 'prop-types'
// import _ from 'lodash'

import Button from 'material-ui/Button'
// import { green } from 'material-ui/colors'
import { MenuList, MenuItem } from 'material-ui/Menu'
import Popover from 'material-ui/Popover'
import TextField from 'material-ui/TextField'
import { animateScroll as scroll } from 'react-scroll'
import FontAwesome from 'react-fontawesome'

class AddItemButton extends React.PureComponent {
  state = {
    menuOpen: false,
    anchorEl: null,
    newItemName: ''
  }

  handleAddButtonClick = () => {
    // this.setState({ menuOpen: true, anchorEl: event.currentTarget })
    // this.props.add(this.props.order)
    // if (this.props.first) {
    //   scroll.scrollToTop()
    // }
  }

  closeMenu = () => {
    this.setState({ menuOpen: false })
  }

  addItem = type => () => {
    if (!this.state.newItemName) return
    // const { collectionId, order, first } = this.props
    // const name = this.state.newItemName
    // Meteor.call('addItem', type, collectionId, name, order, () => {
    //   if (first) {
    //     scroll.scrollToTop()
    //   }
    // })
    this.setState({ newItemName: '', menuOpen: false })
  }

  handleNameChange = (event) => {
    this.setState({ newItemName: event.target.value })
  }

  render() {
    return (
      <div className="AddItemButton">
        <button
          className="button"
          onClick={this.handleAddButtonClick}
        >
          <FontAwesome name="plus" />
        </button>
        <Popover
          anchorEl={this.state.anchorEl}
          open={this.state.menuOpen}
          onClose={this.handleClose}
        >
          <div style={{ textAlign: 'right' }}>
            <Button mini color="accent" onClick={this.closeMenu}>
              &times;
            </Button>
          </div>
          <div style={{ padding: '0 10px' }}>
            <TextField
              id="name"
              label="Name"
              value={this.state.newItemName}
              onChange={this.handleNameChange}
              margin="normal"
              autoFocus
            />
          </div>
          <MenuList>
            <MenuItem onClick={this.addItem('atom')}>Atom</MenuItem>
            <MenuItem onClick={this.addItem('collection')}>Collection</MenuItem>
          </MenuList>
        </Popover>
      </div>
    )
  }
}

AddItemButton.propTypes = {
  // add: PropTypes.func.isRequired,
  // collectionId: PropTypes.string.isRequired,
  order: PropTypes.number.isRequired,
  first: PropTypes.bool,
}

AddItemButton.defaultProps = {
  first: false
}

export default AddItemButton
