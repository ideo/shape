import React from 'react'

import Button from 'material-ui/Button'
import { MenuList, MenuItem } from 'material-ui/Menu'
import TextField from 'material-ui/TextField'

class GridItemBlank extends React.PureComponent {
  state = {
    newItemName: ''
  }

  close = () => {
    this.props.add(null)
  }

  handleNameChange = (event) => {
    this.setState({ newItemName: event.target.value })
  }

  addItem = type => () => {
    if (!this.state.newItemName) return
    // const { parentId, order } = this.props
    // const name = this.state.newItemName
    this.close()
  }

  render() {
    return (
      <div className="GridItem">
        <div style={{ textAlign: 'right' }}>
          <Button mini color="accent" onClick={this.close}>
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
      </div>

    )
  }
}

export default GridItemBlank
