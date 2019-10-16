import React from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import { Pill } from '~/ui/global/styled/forms'
import Avatar from '~/ui/global/Avatar'
import v from '~/utils/variables'

const ChipHolder = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
`
ChipHolder.displayName = 'StyledChipHolder'

// Holder needs extra specificity to not be overridden by material ui (&&)
const IconHolder = styled.span`
  && {
    width: 9px;
    height: 20px;
    margin-left: 0px;
    margin-bottom: 2px;
    color: ${v.colors.commonDark};
  }
`
IconHolder.displayName = 'StyledIconHolder'

const PillIconHolder = styled.span`
  && {
    width: 16px;
    height: 16px;
    display: inline-block;
  }
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
            avatar = (
              <Avatar
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

          // This could be a user, a group or an unregistered user
          return (
            <Pill
              className="pill"
              key={item.name || item.id || item.email}
              avatar={avatar}
              label={item.name}
              onDelete={this.handleDelete(item)}
              deleteIcon={
                <IconHolder>
                  <CloseIcon />
                </IconHolder>
              }
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
