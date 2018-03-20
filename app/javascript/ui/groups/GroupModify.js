import PropTypes from 'prop-types'
import { action, observable, toJS } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import {
  FormButton,
  FieldContainer,
  FormActionsContainer,
  Label,
  ImageField,
  TextField,
} from '~/ui/global/styled/forms'
import FilestackUpload from '~/utils/FilestackUpload'
import Group from '~/stores/jsonApi/Group'

@observer
class GroupModify extends React.Component {
  constructor(props) {
    super()
    const { group } = props
    this.editingGroup = {
      name: group.name || '',
      handle: group.handle || '',
      filestack_file_url: group.filestack_file_url || '',
    }
  }

  @observable editingGroup = null

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

  handleNameChange = (ev) => {
    this.changeName(ev.target.value)
  }

  handleHandleChange = (ev) => {
    this.changeHandle(ev.target.value)
  }

  handleImagePick = (ev) => {
    FilestackUpload
      .pickImage()
      .then(resp => {
        if (resp.filesUploaded.length > 0) {
          const img = resp.filesUploaded[0]
          this.changeUrl(img.url)
        } else {
          console.warn('Failed to upload image:', resp.filesFailed)
        }
      })
  }

  handleSave = (ev) => {
    ev.preventDefault()
    const { onSave } = this.props
    let { group } = this.props
    if (!group.id) {
      group = new Group(toJS(this.editingGroup))
    } else {
      group.name = this.editingGroup.name
      group.handle = this.editingGroup.handle
      group.filestack_file_url = this.editingGroup.filestack_file_url
    }
    group.save().then((res) => {
      onSave && onSave()
    })
  }

  render() {
    return (
      <form>
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
            <ImageField>
              <span>
                +
              </span>
            </ImageField>
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
}

export default GroupModify
