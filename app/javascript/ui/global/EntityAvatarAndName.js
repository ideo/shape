import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import { routingStore } from '~/stores'
import {
  DisplayText,
  SubText,
  SmallHelperText,
} from '~/ui/global/styled/typography'
import Avatar from '~/ui/global/Avatar'
import PublicSharingIcon from '~/ui/icons/PublicSharingIcon'
import v from '~/utils/variables'

const StyledJoinableGroupLabel = styled.div`
  color: ${v.colors.commonDark};
  margin-left: 15px;
  margin-top: 5px;
  .icon {
    width: 28px;
    margin-right: 6px;
  }
`

class EntityAvatarAndName extends React.Component {
  get avatarUrl() {
    const { entity } = this.props
    return entity.pic_url_square || entity.filestack_file_url
  }

  get renderName() {
    const { entity } = this.props
    return entity.nameWithHints || entity.name
  }

  handleClick = () => {
    const { user_profile_collection_id } = this.props.entity
    if (!user_profile_collection_id) return false
    return routingStore.routeTo('collections', user_profile_collection_id, {
      name: this.props.entity.name,
    })
  }

  render() {
    const { entity, isJoinableGroup } = this.props
    return (
      <Flex align="center" onClick={this.handleClick}>
        <Avatar key={entity.id} url={this.avatarUrl} />
        {entity.name && entity.name.trim().length > 0 && (
          <Flex ml={10} column>
            <DisplayText>
              <Flex align="center">
                {this.renderName}
                {isJoinableGroup && (
                  <StyledJoinableGroupLabel>
                    <PublicSharingIcon />
                    <SmallHelperText
                      style={{ position: 'relative', top: '-10px' }}
                    >
                      Public Group
                    </SmallHelperText>
                  </StyledJoinableGroupLabel>
                )}
              </Flex>
            </DisplayText>
            <SubText>{entity.email}</SubText>
          </Flex>
        )}
      </Flex>
    )
  }
}

EntityAvatarAndName.propTypes = {
  entity: MobxPropTypes.objectOrObservableObject.isRequired,
  isJoinableGroup: PropTypes.bool,
}

EntityAvatarAndName.defaultProps = {
  isJoinableGroup: false,
}

export default EntityAvatarAndName
