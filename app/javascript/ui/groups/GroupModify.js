import _ from 'lodash'
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
  editingGroup = {
    name: '',
    handle: '',
    filestack_file_url: '',
    filestack_file_attributes: null,
  }
  @observable
  syncing = false

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const { group, handleDisableForm } = this.props
    runInAction(() => {
      this.editingGroup = {
        name: group.name || '',
        handle: group.handle || '',
        filestack_file_url: group.filestack_file_url || '',
        filestack_file_attributes: null,
      }
      if (!group.id) this.setSyncing(true)
      if (this.editingGroup.handle.length < 2) {
        handleDisableForm(true)
      } else {
        handleDisableForm(false)
      }
    })
  }

  @action
  setSyncing(val) {
    this.syncing = val
  }

  @action
  changeName(name) {
    this.editingGroup.name = name
  }

  @action
  changeHandle(handle) {
    const { handleDisableForm } = this.props
    // limit to 30
    this.editingGroup.handle = handle.slice(0, 30)
    const first = _.first(_.slice(handle, 0, 1))
    // disable the form if the handle starts with a number
    if (!first || parseInt(first).toString() === first) {
      handleDisableForm(true)
    } else {
      handleDisableForm(false)
    }
  }

  @action
  changeUrl(fileAttrs) {
    this.editingGroup.filestack_file_url = fileAttrs.url
    this.editingGroup.filestack_file_attributes = fileAttrs
  }

  handleNameChange = ev => {
    this.changeName(ev.target.value)
    if (this.syncing) this.changeHandle(transformToHandle(ev.target.value))
  }

  handleHandleChange = ev => {
    this.changeHandle(ev.target.value)
    this.setSyncing(false)
  }

  handleRoles = ev => {
    ev.preventDefault()
    const { onGroupRoles } = this.props
    if (onGroupRoles) onGroupRoles()
  }

  handleImagePick = ev => {
    ev.preventDefault()
    FilestackUpload.pickImage({
      onSuccess: fileAttrs => {
        this.changeUrl(fileAttrs)
      },
      onFailure: filesFailed => {
        uiStore.alert(`Failed to upload image: ${filesFailed}`)
      },
    })
  }

  handleSave = ev => {
    ev.preventDefault()
    const { onSave } = this.props
    if (onSave) {
      onSave(this.editingGroup)
    }
  }

  renderImagePicker() {
    let imagePicker = (
      <ImageField>
        <span>+</span>
      </ImageField>
    )
    if (this.editingGroup.filestack_file_url) {
      imagePicker = (
        <Avatar
          title={this.editingGroup.name}
          url={this.editingGroup.filestack_file_url}
          size={100}
          clickable={true}
        />
      )
    }
    return imagePicker
  }

  render() {
    const { group, groupType, formDisabled } = this.props
    const { editingGroup } = this
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
            value={editingGroup.name}
            onChange={this.handleNameChange}
            placeholder={`Enter ${groupType} Name`}
          />
        </FieldContainer>
        <FieldContainer>
          <Label htmlFor="grouphandle">{groupType} handle</Label>
          <div style={{ marginTop: '-10px', marginBottom: '10px' }}>
            <SmallHelperText
              color={
                formDisabled && (editingGroup.name || editingGroup.handle)
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
            value={editingGroup.handle}
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
  onSave: PropTypes.func.isRequired,
  onGroupRoles: PropTypes.func,
  groupType: PropTypes.oneOf(['Group', 'Organization']),
  handleDisableForm: PropTypes.func.isRequired,
  formDisabled: PropTypes.bool.isRequired,
}
GroupModify.defaultProps = {
  onGroupRoles: null,
  onCancel: () => {},
  groupType: 'Group',
  creatingOrg: false,
  isLoading: false,
}

export default GroupModify
