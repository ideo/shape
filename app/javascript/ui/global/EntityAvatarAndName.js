import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import { routingStore } from '~/stores'
import { DisplayText, SubText } from '~/ui/global/styled/typography'
import Avatar from '~/ui/global/Avatar'

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
    return routingStore.routeTo('collections', user_profile_collection_id)
  }

  render() {
    const { entity, isJoinableGroup } = this.props
    return (
      <Flex align="center" onClick={this.handleClick}>
        <Avatar key={entity.id} url={this.avatarUrl} />
        {entity.name &&
          entity.name.trim().length > 0 && (
            <Flex ml={10} column>
              <DisplayText>
                {this.renderName}
                {isJoinableGroup && ' <JOINABLE>'}
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
