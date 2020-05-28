import React from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import ListIcon from '~/ui/icons/ListIcon'
import GridIcon from '~/ui/icons/GridIcon'

const IconHolder = styled.div`
  height: 32px;
  pointer: cursor;
  width: 32px;
`

class CollectionViewToggle extends React.Component {
  onGridClick = () => {
    const { collection } = this.props
    collection.setViewMode('grid')
  }

  onListClick = () => {
    const { collection } = this.props
    collection.setViewMode('list')
  }

  render() {
    return (
      <Flex align="center">
        <IconHolder onClick={this.onGridClick}>
          <GridIcon/>
        </IconHolder>
        <IconHolder onClick={this.onListClick}>
          <ListIcon />
        </IconHolder>
      </Flex>
    )
  }
}
CollectionViewToggle.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionViewToggle
