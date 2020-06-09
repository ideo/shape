import React from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import ListIcon from '~/ui/icons/ListIcon'
import GridIcon from '~/ui/icons/GridIcon'
import v from '~/utils/variables'

const IconHolder = styled.div`
  color: ${props => (props.active ? v.colors.black : v.colors.commonDark)};
  cursor: ${props => (props.active ? 'default' : 'pointer')};
  height: 32px;
  width: 32px;

  &:hover {
    color: ${props => (props.active ? v.colors.commonDark : v.colors.dark)};
  }
`
IconHolder.defaultProps = {
  active: false,
}

@observer
class CollectionViewToggle extends React.Component {
  onGridClick = () => {
    const { collection } = this.props
    collection.setViewMode('grid')
  }

  onListClick = () => {
    const { collection } = this.props
    collection.setViewMode('list')
  }

  get isCurrentlyListMode() {
    const { collection } = this.props
    return collection.viewMode === 'list'
  }

  render() {
    const { isCurrentlyListMode } = this
    return (
      <Flex align="center">
        <IconHolder onClick={this.onGridClick} active={!isCurrentlyListMode}>
          <GridIcon />
        </IconHolder>
        <IconHolder onClick={this.onListClick} active={isCurrentlyListMode}>
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
