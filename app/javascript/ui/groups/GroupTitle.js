import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Row, RowItem } from '~/ui/global/styled/layout'
import { SubduedTitle, Heading2 } from '~/ui/global/styled/typography'
import {
  FormButton,
  StyledAutosizeInput,
  EditAvatarButton
} from '~/ui/global/styled/forms'
import Avatar from '~/ui/global/Avatar'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import FilestackUpload from '~/utils/FilestackUpload'
import v from '~/utils/variables'
import { uiStore } from '~/stores'

const StyledTitleItem = RowItem.extend`
  align-self: baseline;
  margin-bottom: 0;
  margin-left: 14px;
  margin-top: 8px;
`

const EditIconHolder = styled.button`
  cursor: pointer;
  display: block;
  margin-bottom: -8px;
  svg {
    fill: ${v.colors.gray};
    width: 18px;
  }
`
EditIconHolder.displayName = 'EditIconHolder'

@observer
class GroupTitle extends React.Component {
  @observable editing = false

  @action toggleEditing() {
    this.editing = !this.editing
  }

  updateGroupName = (ev) => {
    const { group } = this.props
    group.name = ev.target.value
  }

  updateGroupHandle = (ev) => {
    const { group } = this.props
    group.handle = ev.target.value
  }

  updateGroupAvatar(fileData) {
    const { group } = this.props
    group.filestack_file_url = fileData.url
    group.assign('filestack_file_attributes', fileData)
  }

  handleEdit = (ev) => {
    ev.preventDefault()
    this.toggleEditing()
  }

  handleSave = (ev) => {
    const { group, onSave } = this.props
    ev.preventDefault()
    group.save()
    this.toggleEditing()
    onSave(group)
  }

  handleInputKeys = (ev) => {
    if (ev.key === 'Enter') this.handleSave(ev)
  }

  // TODO move this to shared location, dupe with GroupeModify
  handleAvatarEdit = (ev) => {
    ev.preventDefault()
    FilestackUpload
      .pickImage()
      .then(resp => {
        if (resp.filesUploaded.length > 0) {
          const img = resp.filesUploaded[0]
          const fileAttrs = {
            url: img.url,
            handle: img.handle,
            filename: img.filename,
            size: img.size,
            mimetype: img.mimetype,
          }
          this.updateGroupAvatar(fileAttrs)
        } else {
          uiStore.alert({
            prompt: `Failed to upload image: ${resp.filesFailed}`,
          })
        }
      })
  }

  renderAutosize(name, fontSize, handler) {
    return (
      <StyledAutosizeInput
        maxLength={40}
        className="input__name"
        style={{ fontSize, marginTop: 0 }}
        fontSize={fontSize}
        value={name}
        onChange={handler}
        onKeyPress={this.handleInputKeys}
      />
    )
  }

  renderControls() {
    if (!this.props.canEdit) return ''
    if (this.editing) {
      return (
        <FormButton
          onClick={this.handleSave}
          width={130}
          type="submit"
        >
          Save
        </FormButton>
      )
    }
    return (
      <EditIconHolder onClick={this.handleEdit}>
        <EditPencilIcon />
      </EditIconHolder>
    )
  }

  render() {
    const { group } = this.props
    return (
      <Row>
        <RowItem>
          <EditAvatarButton
            editing={this.editing}
            onClick={this.editing ? this.handleAvatarEdit : () => {}}
          >
            <Avatar
              title={group.name}
              url={group.filestack_file_url}
              className="groupAvatar"
              size={50}
            />
          </EditAvatarButton>
        </RowItem>
        <StyledTitleItem>
          { this.editing
            ? (
              this.renderAutosize(group.name, 1.5, this.updateGroupName)
            )
            : (
              <Heading2>{group.name}</Heading2>
            )
          }
        </StyledTitleItem>
        <StyledTitleItem>
          { this.editing
            ? (
              this.renderAutosize(group.handle, 1, this.updateGroupHandle)
            )
            : (
              <SubduedTitle>@{group.handle}</SubduedTitle>
            )
          }
        </StyledTitleItem>
        <StyledTitleItem>
          {this.renderControls()}
        </StyledTitleItem>
      </Row>
    )
  }
}

GroupTitle.propTypes = {
  group: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired,
}

export default GroupTitle
