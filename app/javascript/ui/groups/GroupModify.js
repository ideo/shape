import PropTypes from 'prop-types'
import { action, runInAction, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import parameterize from 'parameterize'
import TextButton from '~/ui/global/TextButton'
import { SmallHelperText } from '~/ui/global/styled/typography'
import {
  FieldContainer,
  Label,
  ImageField,
  TextField,
} from '~/ui/global/styled/forms'
import { uiStore } from '~/stores'
import { FloatRight, ScrollArea } from '~/ui/global/styled/layout'
import FilestackUpload from '~/utils/FilestackUpload'
import Avatar from '~/ui/global/Avatar'
import v from '~/utils/variables'

function transformToHandle(name) {
  // Keep in sync with models/group.rb
  return parameterize(name)
}

@observer
class GroupModify extends React.Component {
  @observable
  syncing = false

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const { group } = this.props
    runInAction(() => {
      if (!group.id) this.setSyncing(true)
    })
  }

  @action
  setSyncing(val) {
    this.syncing = val
  }

  handleNameChange = ev => {
    const { changeGroupFormName, changeGroupFormHandle } = this.props
    changeGroupFormName(ev.target.value)
    if (this.syncing) changeGroupFormHandle(transformToHandle(ev.target.value))
  }

  handleHandleChange = ev => {
    const { changeGroupFormHandle } = this.props
    changeGroupFormHandle(ev.target.value)
    this.setSyncing(false)
  }

  handleRoles = ev => {
    ev.preventDefault()
    const { onGroupRoles } = this.props
    if (onGroupRoles) onGroupRoles()
  }

  handleImagePick = ev => {
    const { changeGroupFormFileAttrs } = this.props
    ev.preventDefault()
    FilestackUpload.pickImage({
      onSuccess: fileAttrs => {
        changeGroupFormFileAttrs(fileAttrs)
      },
      onFailure: filesFailed => {
        uiStore.alert(`Failed to upload image: ${filesFailed}`)
      },
    })
  }

  renderImagePicker() {
    const { groupFormFields } = this.props
    let imagePicker = (
      <ImageField>
        <span>+</span>
      </ImageField>
    )
    if (groupFormFields.filestack_file_url) {
      imagePicker = (
        <Avatar
          title={groupFormFields.name}
          url={groupFormFields.filestack_file_url}
          size={100}
          clickable={true}
        />
      )
    }
    return imagePicker
  }

  render() {
    const { group, groupType, formDisabled, groupFormFields } = this.props
    return (
      <ScrollArea>
        <FloatRight>
          {group.id && (
            <TextButton onClick={this.handleRoles}>Members</TextButton>
          )}
        </FloatRight>
        <FieldContainer>
          <Label htmlFor="groupName">{groupType} Name</Label>
          <TextField
            id="groupName"
            type="text"
            data-cy="TextField_groupName"
            value={groupFormFields.name}
            onChange={this.handleNameChange}
            placeholder={`Enter ${groupType} Name`}
          />
        </FieldContainer>
        <FieldContainer>
          <Label htmlFor="grouphandle">{groupType} handle</Label>
          <div style={{ marginTop: '-10px', marginBottom: '10px' }}>
            <SmallHelperText
              color={
                formDisabled && (groupFormFields.name || groupFormFields.handle)
                  ? v.colors.alert
                  : v.colors.commonMedium
              }
            >
              Must be 1-30 characters, starting with a letter.
            </SmallHelperText>
          </div>
          <TextField
            id="grouphandle"
            type="text"
            data-cy="TextField_groupHandle"
            value={groupFormFields.handle}
            onChange={this.handleHandleChange}
            placeholder={`@${groupType.toLowerCase()}-handle`}
          />
        </FieldContainer>
        <FieldContainer>
          <Label htmlFor="groupAvatar">{groupType} Avatar</Label>
          <button onClick={this.handleImagePick} id="groupAvatar">
            {this.renderImagePicker()}
          </button>
        </FieldContainer>
      </ScrollArea>
    )
  }
}

GroupModify.propTypes = {
  group: MobxPropTypes.objectOrObservableObject.isRequired,
  groupFormFields: MobxPropTypes.objectOrObservableObject.isRequired,
  onGroupRoles: PropTypes.func,
  groupType: PropTypes.oneOf(['Group', 'Organization']),
  formDisabled: PropTypes.bool.isRequired,
  changeGroupFormName: PropTypes.func.isRequired,
  changeGroupFormHandle: PropTypes.func.isRequired,
  changeGroupFormFileAttrs: PropTypes.func.isRequired,
}
GroupModify.defaultProps = {
  onGroupRoles: null,
  onCancel: () => {},
  groupType: 'Group',
  creatingOrg: false,
}

export default GroupModify
