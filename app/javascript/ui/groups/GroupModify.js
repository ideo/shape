import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import parameterize from 'parameterize'
import {
  FormButton,
  FieldContainer,
  FormActionsContainer,
  Label,
  ImageField,
  TextButton,
  TextField,
} from '~/ui/global/styled/forms'
import { uiStore } from '~/stores'
import { FloatRight } from '~/ui/global/styled/layout'
import FilestackUpload from '~/utils/FilestackUpload'
import Avatar from '~/ui/global/Avatar'

function transformToHandle(name) {
  // Keep in sync with models/group.rb
  return parameterize(name)
}

@observer
class GroupModify extends React.Component {
  @observable editingGroup = {
    name: '',
    handle: '',
    filestack_file_url: '',
    filestack_file_attributes: null,
  }
  @observable syncing = false

  constructor(props) {
    super(props)
    const { group } = props
    this.editingGroup = {
      name: group.name || '',
      handle: group.handle || '',
      filestack_file_url: group.filestack_file_url || '',
      filestack_file_attributes: null,
    }
    if (!group.id) this.setSyncing(true)
  }

  @action setSyncing(val) {
    this.syncing = val
  }

  @action
  changeName(name) {
    this.editingGroup.name = name
  }

  @action
  changeHandle(handle) {
    this.editingGroup.handle = handle
  }

  @action
  changeUrl(fileAttrs) {
    this.editingGroup.filestack_file_url = fileAttrs.url
    this.editingGroup.filestack_file_attributes = fileAttrs
  }

  handleNameChange = (ev) => {
    this.changeName(ev.target.value)
    if (this.syncing) this.changeHandle(transformToHandle(ev.target.value))
  }

  handleHandleChange = (ev) => {
    this.changeHandle(ev.target.value)
    this.setSyncing(false)
  }

  handleRoles = (ev) => {
    ev.preventDefault()
    const { onGroupRoles } = this.props
    if (onGroupRoles) onGroupRoles()
  }

  handleImagePick = (ev) => {
    ev.preventDefault()
    FilestackUpload
      .pickImage({
        onSuccess: (fileAttrs) => {
          this.changeUrl(fileAttrs)
        },
        onFailure: (filesFailed) => {
          uiStore.alert({
            prompt: `Failed to upload image: ${filesFailed}`,
          })
        }
      })
  }

  handleSave = (ev) => {
    ev.preventDefault()
    const { onSave } = this.props
    if (onSave) onSave(this.editingGroup)
  }

  renderImagePicker() {
    let imagePicker = (
      <ImageField>
        <span>
          +
        </span>
      </ImageField>
    )
    if (this.editingGroup.filestack_file_url) {
      imagePicker = (
        <Avatar
          title={this.editingGroup.name}
          url={this.editingGroup.filestack_file_url}
          size={100}
        />
      )
    }
    return imagePicker
  }

  render() {
    const { group, groupType } = this.props
    return (
      <form>
        <FloatRight>
          { group.id && (
            <TextButton onClick={this.handleRoles}>
              Members
            </TextButton>
          )}
        </FloatRight>
        <FieldContainer>
          <Label htmlFor="groupName">{groupType} Name</Label>
          <TextField
            id="groupName"
            type="text"
            value={this.editingGroup.name}
            onChange={this.handleNameChange}
            placeholder={`Enter ${groupType} Name`}
          />
        </FieldContainer>
        <FieldContainer>
          <Label htmlFor="grouphandle">{groupType} handle</Label>
          <TextField
            id="grouphandle"
            type="text"
            value={this.editingGroup.handle}
            onChange={this.handleHandleChange}
            placeholder={`@${groupType.toLowerCase()}-handle`}
          />
        </FieldContainer>
        <FieldContainer>
          <Label htmlFor="groupAvatar">{groupType} Avatar</Label>
          <button onClick={this.handleImagePick} id="groupAvatar">
            { this.renderImagePicker() }
          </button>
        </FieldContainer>
        <FormActionsContainer>
          <FormButton
            onClick={this.handleSave}
            width={190}
            type="submit"
          >
            { groupType === 'Group' ? 'Add Members' : 'Save' }
          </FormButton>
        </FormActionsContainer>
      </form>
    )
  }
}

GroupModify.propTypes = {
  group: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func.isRequired,
  onGroupRoles: PropTypes.func,
  groupType: PropTypes.oneOf(['Group', 'Organization']),
}
GroupModify.defaultProps = {
  onGroupRoles: null,
  groupType: 'Group',
}

export default GroupModify
