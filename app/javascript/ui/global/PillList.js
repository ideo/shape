import React from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { withStyles } from 'material-ui/styles'
import Chip from 'material-ui/Chip'

import v from '~/utils/variables'
import CloseIcon from '~/ui/icons/CloseIcon'
import UserAvatar from '~/ui/layout/UserAvatar'

const materialStyles = {
  chip: {
    padding: '7px',
    margin: '5px',
    fontWeight: 300,
    fontFamily: 'Gotham',
    fontSize: '1rem',
    justifyContent: 'flex-start',
    backgroundColor: v.colors.desert,
    borderRadius: 0,
  },
  avatar: {
    height: '38px',
    width: '38px',
  },
  icon: {
    width: '9px',
    height: '20px',
    marginLeft: '0px',
    marginBottom: '2px',
  }
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
            avatar = <UserAvatar size={38} user={item} />
          }

          return (
            <Chip
              key={item.email}
              avatar={avatar}
              label={item.name}
              onDelete={this.handleDelete(item)}
              className={classes.chip}
              deleteIcon={<span className={classes.icon}><CloseIcon /></span>}
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
