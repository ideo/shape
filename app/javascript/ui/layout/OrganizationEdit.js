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
} from '~/ui/global/styled'

@observer
class OrganizationEdit extends React.Component {
  constructor(props) {
    super()
    const { organization } = props
    this.editingOrganization = {
      name: organization.name,
      filestack_file_url: organization.filestack_file_url
    }
  }

  @observable editingOrganization = null

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
    const { organization, onSave } = this.props
    organization.name = this.editingOrganization.name
    organization.filestack_file_url = this.editingOrganization.filestack_file_url
    organization.save().then(() => {
      onSave && onSave()
    })
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

OrganizationEdit.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func,
}
OrganizationEdit.defaultProps = {
  onSave: () => {}
}

export default OrganizationEdit
