import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { MenuItem } from 'material-ui/Menu'
import { withStyles } from 'material-ui/styles'
import UserAvatar from '~/ui/layout/UserAvatar'

const Row = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`
Row.displayName = 'Row'

const RowItemLeft = styled.span`
  margin-right: auto;
  margin-left: 14px;
`
RowItemLeft.displayName = 'RowItemLeft'

const StyledText = styled.span`
  font-weight: 300;
  font-family: Gotham;
  font-size: 16px
`
StyledText.displayName = 'StyledText'

const optionStyles = {
  root: {
    alignItems: 'center',
    opacity: 0.5,
    '&:hover': {
      opacity: 1.0
    }
  }
}

class AutocompleteOption extends React.Component {
  handleClick = event => {
    this.props.onSelect(this.props.option, event)
  }

  render() {
    const {
      children, classes, isFocused, isSelected, option, onFocus
    } = this.props
    let content = children
    if (!option.className) {
      const { data } = option
      content = (
        <Row>
          <span>
            <UserAvatar
              key={data.id}
              data={data}
              size={38}
            />
          </span>
          <RowItemLeft>
            <StyledText>{data.name}</StyledText><br />
          </RowItemLeft>
        </Row>
      )
    }

    // TODO abstract render of user with avatar to shared place
    return (
      <MenuItem
        classes={classes}
        onFocus={onFocus}
        selected={isFocused}
        onClick={this.handleClick}
        component="div"
        style={{
          fontWeight: isSelected ? 500 : 400,
          height: '38px',
          marginBottom: '7px',
          padding: '0 4px',
        }}
      >
        { content }
      </MenuItem>
    )
  }
}

AutocompleteOption.propTypes = {
  children: PropTypes.arrayOf(PropTypes.Element),
  classes: PropTypes.shape({
    root: PropTypes.string,
  }).isRequired,
  isFocused: PropTypes.bool,
  isSelected: PropTypes.bool,
  option: PropTypes.shape({
    className: PropTypes.string,
    data: PropTypes.object,
  }).isRequired,
  onSelect: PropTypes.func,
  onFocus: PropTypes.func,
}
AutocompleteOption.defaultProps = {
  children: [],
  isFocused: false,
  isSelected: false,
  onSelect: () => {},
  onFocus: () => {},
}
export default withStyles(optionStyles)(AutocompleteOption)
