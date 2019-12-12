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
  handleDelete = item => () => {
    this.props.onItemDelete(item)
  }

  render() {
    const { itemList } = this.props
    return (
      <ChipHolder>
        {itemList.map(item => {
          let avatar = null
          let symbolSize = 16
          if (item.pic_url_square) {
            avatar = (
              <StyledAvatar
                className="avatar"
                size={26}
                title={item.name}
                url={item.pic_url_square}
              />
            )
            symbolSize = 26
          }
          if (item.icon) {
            avatar = <PillIconHolder>{item.icon}</PillIconHolder>
          }

          const identifier = item.name || item.id || item.email
          // This could be a user, a group or an unregistered user
          return (
            <Pill
              key={identifier}
              tag={item.type === 'tag' ? item : null}
              symbol={avatar}
              symbolSize={symbolSize}
              label={item.name || identifier}
              id={item.id || identifier}
              onDelete={this.handleDelete(item)}
              selectable={item.selectable}
              selected={item.selected}
              onSelect={item.onSelect}
            />
          )
        })}
      </ChipHolder>
    )
  }
}

PillList.propTypes = {
  itemList: MobxPropTypes.arrayOrObservableArray.isRequired,
  onItemDelete: PropTypes.func.isRequired,
}

export default PillList
