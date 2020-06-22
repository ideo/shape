import React from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import Tooltip from '~/ui/global/Tooltip'
import ListIcon from '~/ui/icons/ListIcon'
import GridIcon from '~/ui/icons/GridIcon'
import v from '~/utils/variables'

const IconHolder = styled.div`
  color: ${v.colors.black};
  display: ${props => (props.show ? 'block' : 'none')};
  cursor: pointer;
  height: 32px;
  width: 32px;

  &:hover {
    color: ${v.colors.commonDarkest};
  }
`
IconHolder.displayName = 'IconHolder'
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
        <Tooltip classes={{ tooltip: 'Tooltip' }} title="Grid view">
          <IconHolder onClick={this.onGridClick} show={isCurrentlyListMode}>
            <GridIcon />
          </IconHolder>
        </Tooltip>
        <Tooltip classes={{ tooltip: 'Tooltip' }} title="List view">
          <IconHolder onClick={this.onListClick} show={!isCurrentlyListMode}>
            <ListIcon />
          </IconHolder>
        </Tooltip>
      </Flex>
    )
  }
}
CollectionViewToggle.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionViewToggle
