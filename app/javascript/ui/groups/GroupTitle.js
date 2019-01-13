import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Grid from '@material-ui/core/Grid'
import { Row, RowItem } from '~/ui/global/styled/layout'
import { SubduedTitle, Heading2 } from '~/ui/global/styled/typography'
import {
  FormButton,
  StyledAutosizeInput,
  EditAvatarButton,
} from '~/ui/global/styled/forms'
import Avatar from '~/ui/global/Avatar'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import FilestackUpload from '~/utils/FilestackUpload'
import v from '~/utils/variables'
import { uiStore } from '~/stores'

const StyledTitleGrid = styled(Grid)`
  align-self: baseline;
  margin-bottom: 0;
  margin-top: 8px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint + 1}px) {
    flex-wrap: nowrap !important;
  }
`

const StyledTitleItem = styled(Grid)`
  padding-left: 14px;
`

const StyledHeading2 = Heading2.extend`
  margin-bottom: 0;
`
StyledHeading2.displayName = 'StyledHeading2'

const EditIconHolder = styled.button`
  cursor: pointer;
  display: block;
  svg {
    fill: ${v.colors.commonMedium};
    margin-bottom: -2px;
    width: 18px;
  }
`
EditIconHolder.displayName = 'EditIconHolder'

@observer
class GroupTitle extends React.Component {
  @observable
  editing = false

  @action
  toggleEditing() {
    this.editing = !this.editing
  }

  updateGroupName = ev => {
    const { group } = this.props
    group.name = ev.target.value
  }

  updateGroupHandle = ev => {
    const { group } = this.props
    group.handle = ev.target.value
  }

  updateGroupAvatar(fileData) {
    const { group } = this.props
    group.filestack_file_url = fileData.url
    group.assign('filestack_file_attributes', fileData)
  }

  handleEdit = ev => {
    ev.preventDefault()
    this.toggleEditing()
  }

  handleSave = async ev => {
    const { group, onSave } = this.props
    ev.preventDefault()
    this.toggleEditing()
    await group.save()
    if (onSave) onSave(group)
  }

  handleInputKeys = ev => {
    if (ev.key === 'Enter') this.handleSave(ev)
  }

  handleAvatarEdit = ev => {
    ev.preventDefault()
    FilestackUpload.pickImage({
      onSuccess: fileAttrs => {
        this.updateGroupAvatar(fileAttrs)
      },
      onFailure: filesFailed => {
        uiStore.alert(`Failed to upload image: ${filesFailed}`)
      },
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
        <FormButton onClick={this.handleSave} width={130} type="submit">
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
            canEdit={this.editing}
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
        <StyledTitleGrid container justify="flex-start" alignItems="baseline">
          <StyledTitleItem item>
            {this.editing ? (
              this.renderAutosize(group.name, 1.5, this.updateGroupName)
            ) : (
              <StyledHeading2>{group.name}</StyledHeading2>
            )}
          </StyledTitleItem>
          <StyledTitleItem item>
            {this.editing ? (
              this.renderAutosize(group.handle, 1, this.updateGroupHandle)
            ) : (
              <SubduedTitle>@{group.handle}</SubduedTitle>
            )}
          </StyledTitleItem>
          <StyledTitleItem item>{this.renderControls()}</StyledTitleItem>
        </StyledTitleGrid>
      </Row>
    )
  }
}

GroupTitle.propTypes = {
  group: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func,
  canEdit: PropTypes.bool,
}
GroupTitle.defaultProps = {
  onSave: null,
  canEdit: false,
}

export default GroupTitle
