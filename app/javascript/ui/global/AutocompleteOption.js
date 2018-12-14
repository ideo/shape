import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import { DisplayText } from '~/ui/global/styled/typography'
import { SelectOption } from '~/ui/global/styled/forms'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import Avatar from '~/ui/global/Avatar'

const AvatarHolder = styled.span`
  height: 60px;
  flex-grow: 0;
  width: 40px;

  svg {
    margin-left: 5px;
    margin-top: 25px;
  }
  img,
  svg {
    height: 60px;
    object-fit: cover;
    width: 40px;
  }
`

class AutocompleteOption extends React.Component {
  handleClick = event => {
    this.props.selectOption(this.props.data, event)
  }

  renderUserAvatar() {
    const { data } = this.props
    const entity = data.data
    const url = entity.pic_url_square || entity.filestack_file_url
    return <Avatar url={url} title={entity.name} key={entity.id} size={38} />
  }

  renderCollectionAvatar() {
    const { data } = this.props
    const entity = data.data
    let content
    content = <CollectionIcon viewBox="50 50 170 170" />
    if (entity.cover.image_url) {
      content = <img src={entity.cover.image_url} alt={entity.name} />
    }
    return <AvatarHolder>{content}</AvatarHolder>
  }

  render() {
    const { children, isFocused, data, onFocus } = this.props
    let content = children
    const entity = data.data
    if (entity) {
      const name = _.trim(entity.name) ? entity.name : entity.email
      content = (
        <Row align="center" noSpacing style={{ height: '38px' }}>
          <span>
            {entity.internalType === 'collections'
              ? this.renderCollectionAvatar()
              : this.renderUserAvatar()}
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
