import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, runInAction, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import parameterize from 'parameterize'
import Button from '~/ui/global/Button'
import TextButton from '~/ui/global/TextButton'
import { SmallHelperText, SubduedText } from '~/ui/global/styled/typography'
import {
  FieldContainer,
  FormActionsContainer,
  Label,
  ImageField,
  TextField,
} from '~/ui/global/styled/forms'
import { uiStore } from '~/stores'
import { FloatRight } from '~/ui/global/styled/layout'
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
  @observable
  formDisabled = false

  constructor(props) {
    super(props)
    const { group } = props
    runInAction(() => {
      this.editingGroup = {
        name: group.name || '',
        handle: group.handle || '',
        filestack_file_url: group.filestack_file_url || '',
        filestack_file_attributes: null,
      }
      if (!group.id) this.setSyncing(true)
      if (this.editingGroup.handle.length < 2) {
        this.formDisabled = true
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
    // limit to 30
    this.editingGroup.handle = handle.slice(0, 30)
    const first = _.first(_.slice(handle, 0, 1))
    // disable the form if the handle starts with a number
    this.formDisabled = parseInt(first).toString() === first
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
    const { creatingOrg, group, groupType, onCancel, isLoading } = this.props
    const { editingGroup } = this
    return (
      <form>
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
                this.formDisabled && editingGroup.name
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
        <FormActionsContainer>
          <Button
            data-cy="FormButton_submitGroup"
            disabled={this.formDisabled || isLoading}
            onClick={this.handleSave}
            minWidth={190}
            type="submit"
          >
            {groupType === 'Group' ? 'Add Members' : 'Save'}
          </Button>
        </FormActionsContainer>
        {creatingOrg && (
          <div style={{ textAlign: 'center' }}>
            <SubduedText fontSize="12px">
              Are you looking for your team? You may need to ask for an
              invitation.
            </SubduedText>
            <br />
            <br />
            <TextButton onClick={onCancel}>Come back later</TextButton>
          </div>
        )}
      </form>
    )
  }
}

GroupModify.propTypes = {
  group: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  onGroupRoles: PropTypes.func,
  groupType: PropTypes.oneOf(['Group', 'Organization']),
  creatingOrg: PropTypes.bool,
  isLoading: PropTypes.bool,
}
GroupModify.defaultProps = {
  onGroupRoles: null,
  onCancel: () => {},
  groupType: 'Group',
  creatingOrg: false,
  isLoading: false,
}

export default GroupModify
