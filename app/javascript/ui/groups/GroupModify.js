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
import { RowItemRight } from '~/ui/global/styled/layout'
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

  @action afterSave(res) {
    const { apiStore } = this.props
    const existing = apiStore.currentUser.groups.find(
      existingGroup => existingGroup.id === res.id
    )
    if (!existing) {
      apiStore.fetch('users', apiStore.currentUserId)
    }
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
    this.props.onGroupRoles(this.props.group)
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
          console.warn('Failed to upload image:', resp.filesFailed)
        }
      })
  }

  handleSave = (ev) => {
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
    group.assign('filestack_file_attributes', this.fileAttrs)
    group.save()
      .then((res) => {
        // TODO why isn't res wrapped in "data"?
        this.afterSave(res)
        onSave && onSave()
      })
      .catch((err) => {
        console.warn(err)
        group.name = originalGroup.name
        group.handle = originalGroup.handle
        group.filestack_file_url = originalGroup.filestack_file_url
      })
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
    return (
      <form>
        <RowItemRight>
          <TextButton onClick={this.handleRoles}>
            Members
          </TextButton>
        </RowItemRight>
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
            type="submit"
          >
            Save
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
