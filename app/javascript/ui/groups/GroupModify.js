import PropTypes from 'prop-types'
import { action, observable, toJS } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
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
import Group from '~/stores/jsonApi/Group'
import Avatar from '~/ui/global/Avatar'

function transformToHandle(name) {
  // Keep in sync with models/group.rb
  return parameterize(name)
}

@inject('apiStore')
@observer
class GroupModify extends React.Component {
  @observable editingGroup = {
    name: '',
    handle: '',
    filestack_file_url: ''
  }
  @observable syncing = false

  constructor(props) {
    super(props)
    const { group } = props
    this.editingGroup = {
      name: group.name || '',
      handle: group.handle || '',
      filestack_file_url: group.filestack_file_url || '',
    }
    if (!group.id) this.setSyncing(true)
    this.fileAttrs = {}
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
  changeUrl(url) {
    this.editingGroup.filestack_file_url = url
  }

  @action afterSave = async (group) => {
    const { apiStore } = this.props
    const existing = apiStore.currentUser.groups.find(
      existingGroup => existingGroup.id === group.id
    )
    if (existing) {
      return existing
    }
    await apiStore.fetch('users', apiStore.currentUserId)
    return group
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
    this.props.onGroupRoles()
  }

  handleImagePick = (ev) => {
    ev.preventDefault()
    FilestackUpload
      .pickImage()
      .then(resp => {
        if (resp.filesUploaded.length > 0) {
          const img = resp.filesUploaded[0]
          this.fileAttrs = {
            url: img.url,
            handle: img.handle,
            filename: img.filename,
            size: img.size,
            mimetype: img.mimetype,
          }
          this.changeUrl(img.url)
        } else {
          uiStore.alert({
            prompt: `Failed to upload image: ${resp.filesFailed}`,
          })
        }
      })
  }

  handleSave = async (ev) => {
    ev.preventDefault()
    const { apiStore, onSave } = this.props
    let { group } = this.props
    const originalGroup = Object.assign({}, group)
    if (!group.id) {
      group = new Group(toJS(this.editingGroup), apiStore)
    } else {
      group.name = this.editingGroup.name
      group.handle = this.editingGroup.handle
      group.filestack_file_url = this.editingGroup.filestack_file_url
    }
    if (this.fileAttrs.url) {
      group.assign('filestack_file_attributes', this.fileAttrs)
    }
    try {
      let savedGroup = await group.save()
      savedGroup = await this.afterSave(savedGroup)
      onSave && onSave(savedGroup)
    } catch (err) {
      console.warn(err)
      group.name = originalGroup.name
      group.handle = originalGroup.handle
      group.filestack_file_url = originalGroup.filestack_file_url
    }
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
    const { group } = this.props
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
          <Label htmlFor="groupName">Group Name</Label>
          <TextField
            id="groupName"
            type="text"
            value={this.editingGroup.name}
            onChange={this.handleNameChange}
            placeholder="Enter Group Name"
          />
        </FieldContainer>
        <FieldContainer>
          <Label htmlFor="grouphandle">Group handle</Label>
          <TextField
            id="grouphandle"
            type="text"
            value={this.editingGroup.handle}
            onChange={this.handleHandleChange}
            placeholder="@group-handle"
          />
        </FieldContainer>
        <FieldContainer>
          <Label htmlFor="groupAvatar">Group Avatar</Label>
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
            Add Members &gt;
          </FormButton>
        </FormActionsContainer>
      </form>
    )
  }
}

GroupModify.propTypes = {
  group: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func.isRequired,
  onGroupRoles: PropTypes.func.isRequired,
}
GroupModify.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GroupModify
