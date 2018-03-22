import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FilestackUpload from '~/utils/FilestackUpload'
import {
  FieldContainer,
  FormButton,
  FormActionsContainer,
  ImageField,
  Label,
  TextField,
} from '~/ui/global/styled/forms'
import OrganizationAvatar from '~/ui/organizations/OrganizationAvatar'

@observer
class OrganizationEdit extends React.Component {
  @observable editingOrganization = {
    name: '',
    filestack_file_url: ''
  }

  constructor(props) {
    super()
    const { organization } = props
    this.editingOrganization = {
      name: organization.name,
      filestack_file_url: organization.filestack_file_url
    }
    this.fileAttrs = {}
  }

  @action
  changeName(name) {
    this.editingOrganization.name = name
  }

  @action
  changeUrl(url) {
    this.editingOrganization.filestack_file_url = url
  }

  handleNameChange = (ev) => {
    this.changeName(ev.target.value)
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
    const { organization, onSave } = this.props
    const originalOrg = Object.assign({}, organization)
    organization.name = this.editingOrganization.name
    organization.filestack_file_url = this.editingOrganization.filestack_file_url
    organization.assign('filestack_file_attributes', this.fileAttrs)
    organization.save()
      .then(() => {
        onSave && onSave()
      })
      .catch((err) => {
        organization.name = originalOrg.name
        organization.filestack_file_url = originalOrg.filestack_file_url
        console.warn(err)
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
    if (this.editingOrganization.filestack_file_url) {
      imagePicker = (
        <OrganizationAvatar
          organization={this.editingOrganization}
          size={100}
        />
      )
    }
    return imagePicker
  }

  render() {
    return (
      <form>
        <FieldContainer>
          <Label htmlFor="organizationName">Organization Name</Label>
          <TextField
            id="organizationName"
            type="text"
            value={this.editingOrganization.name}
            onChange={this.handleNameChange}
            placeholder="Enter Organization Name"
          />
        </FieldContainer>
        <FieldContainer>
          <Label htmlFor="organizationAvatar">Organization Avatar</Label>
          <button onClick={this.handleImagePick} id="organizationAvatar">
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

OrganizationEdit.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func,
}
OrganizationEdit.defaultProps = {
  onSave: () => {}
}

export default OrganizationEdit
