import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import { DisplayText, SubText } from '~/ui/global/styled/typography'
import { SelectOption } from '~/ui/global/styled/forms'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import Avatar from '~/ui/global/Avatar'
import { GroupIconContainer } from '~/ui/groups/styles'

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
    return <Avatar url={url} title={entity.name} key={entity.id} />
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

  renderGroupIcon() {
    const entity = this.props.data.data
    if (!entity || entity.internalType !== 'groups' || !entity.icon_url) return
    return (
      <GroupIconContainer>
        <img src={entity.icon_url} />
      </GroupIconContainer>
    )
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
            <div>
              <DisplayText>
                {name}
                {this.renderGroupIcon()}
              </DisplayText>
              <br />
              {entity.email && <SubText compact>{entity.email}</SubText>}
            </div>
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
        data-cy={`Autocomplete-Option-${entity.name}`}
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
