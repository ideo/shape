import React from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { withStyles } from 'material-ui/styles'
import Chip from 'material-ui/Chip'

import UserAvatar from '~/ui/layout/UserAvatar'

const materialStyles = {
  chip: {
    margin: '5px',
  },
}

const ChipHolder = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
`

@observer
class PillList extends React.Component {
  handleDelete = item => () => {
    this.props.onItemDelete(item)
  }

  render() {
    const { classes, itemList } = this.props
    return (
      <ChipHolder>
        {itemList.map(item => {
          let avatar = null

          if (item.pic_url_square) {
            // TODO want to use a generic avatar here
            avatar = <UserAvatar user={item} />
          }

          return (
            <Chip
              key={item.name}
              avatar={avatar}
              label={item.name}
              onDelete={this.handleDelete(item)}
              className={classes.chip}
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
  classes: PropTypes.shape({
    chip: PropTypes.string
  }).isRequired,
}

export default withStyles(materialStyles)(PillList)
