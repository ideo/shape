import React from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import Pill from '~/ui/global/Pill'
import Avatar from '~/ui/global/Avatar'

const ChipHolder = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
`
ChipHolder.displayName = 'StyledChipHolder'

const PillIconHolder = styled.span`
  && {
    width: 16px;
    height: 16px;
    display: inline-block;
  }
`

const StyledAvatar = styled(Avatar)`
  margin-left: -3px;
  margin-top: -5px;
`

@observer
class PillList extends React.Component {
  render() {
    const { itemList, onItemDelete } = this.props
    return (
      <ChipHolder>
        {itemList.map(item => {
          let avatar = null
          const symbolSize = 16
          if (item.pic_url_square) {
            avatar = (
              <StyledAvatar
                className="avatar"
                size={26}
                title={item.name}
                url={item.pic_url_square}
              />
            )
          }
          if (item.icon) {
            avatar = <PillIconHolder>{item.icon}</PillIconHolder>
          }

          const pillProps = {
            selectable: item.selectable,
            selected: item.selected,
            onSelect: item.onSelect,
            onDelete: onItemDelete ? () => onItemDelete(item) : null,
          }

          const identifier = item.name || item.id || item.email
          // This could be a user, a group or an unregistered user
          let tag
          if (item.type === 'tag') {
            // Need to move props into tag because Pill will pull them from tag if present
            // Must be assigned in this order so we can override onDelete
            tag = {
              ...item,
              ...pillProps,
            }
          }
          return (
            <Pill
              key={`${item.type}-${identifier}`}
              tag={tag}
              symbol={avatar}
              symbolSize={symbolSize}
              label={item.name || identifier}
              id={item.id || identifier}
              {...pillProps}
            />
          )
        })}
      </ChipHolder>
    )
  }
}

PillList.propTypes = {
  itemList: MobxPropTypes.arrayOrObservableArray.isRequired,
  onItemDelete: PropTypes.func,
}

PillList.defaultProps = {
  onItemDelete: null,
}

export default PillList
