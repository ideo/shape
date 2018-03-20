import React from 'react'
import PropTypes from 'prop-types'
import {
  Row,
  RowItemLeft,
} from '~/ui/global/styled/layout'
import {
  DisplayText,
} from '~/ui/global/styled/typography'
import {
  SelectOption,
} from '~/ui/global/styled/forms'
import UserAvatar from '~/ui/layout/UserAvatar'

class AutocompleteOption extends React.Component {
  handleClick = event => {
    this.props.onSelect(this.props.option, event)
  }

  render() {
    const {
      children, isFocused, option, onFocus
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
            <DisplayText>{data.name}</DisplayText><br />
          </RowItemLeft>
        </Row>
      )
    }

    // TODO abstract render of user with avatar to shared place
    return (
      <SelectOption
        className="selectOption"
        onFocus={onFocus}
        selected={isFocused}
        onClick={this.handleClick}
        component="div"
      >
        { content }
      </SelectOption>
    )
  }
}

AutocompleteOption.propTypes = {
  children: PropTypes.arrayOf(PropTypes.Element),
  isFocused: PropTypes.bool,
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
  onSelect: () => {},
  onFocus: () => {},
}
export default AutocompleteOption
