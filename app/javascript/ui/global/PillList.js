import React from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import Pill from '~/ui/global/styled'
import UserAvatar from '~/ui/layout/UserAvatar'

const ChipHolder = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
`

const IconHolder = styled.span`
  width: 9px;
  height: 20px;
  margin-left: 0px;
  margin-bottom: 2px;
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

          if (item.pic_url_square) {
            // TODO want to use a generic avatar here
            avatar = <UserAvatar className="avatar" size={38} user={item} />
          }

          return (
            <Pill
              key={item.email}
              avatar={avatar}
              label={item.name}
              onDelete={this.handleDelete(item)}
              deleteIcon={<IconHolder><CloseIcon /></IconHolder>}
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
