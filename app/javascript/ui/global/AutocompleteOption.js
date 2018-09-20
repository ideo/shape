import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import { DisplayText } from '~/ui/global/styled/typography'
import { SelectOption } from '~/ui/global/styled/forms'
import Avatar from '~/ui/global/Avatar'

class AutocompleteOption extends React.Component {
  handleClick = event => {
    this.props.selectOption(this.props.data, event)
  }

  render() {
    const { children, isFocused, data, onFocus } = this.props
    let content = children
    const user = data.data
    if (user) {
      const url = user.pic_url_square || user.filestack_file_url
      const name = _.trim(user.name) ? user.name : user.email
      content = (
        <Row align="center" noSpacing>
          <span>
            <Avatar url={url} title={user.name} key={user.id} size={38} />
          </span>
          <RowItemLeft>
            <DisplayText>{name}</DisplayText>
            <br />
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
        {content}
      </SelectOption>
    )
  }
}

AutocompleteOption.propTypes = {
  children: PropTypes.string,
  isFocused: PropTypes.bool,
  data: PropTypes.shape({
    data: PropTypes.object,
  }).isRequired,
  selectOption: PropTypes.func,
  onFocus: PropTypes.func,
}
AutocompleteOption.defaultProps = {
  children: [],
  isFocused: false,
  selectOption: () => {},
  onFocus: () => {},
}
export default AutocompleteOption
