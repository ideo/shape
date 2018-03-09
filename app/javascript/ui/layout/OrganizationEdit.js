import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FilestackUpload from '~/utils/FilestackUpload'
import OrganizationAvatar from '~/ui/layout/OrganizationAvatar'

@observer
class OrganizationEdit extends React.Component {
  constructor(props) {
    super()
    const { organization } = props
    this.editingOrganization = {
      name: organization.name,
      pic_url_square: organization.pic_url_square
    }
  }

  @observable editingOrganization = null

  @action
  changeName(name) {
    this.editingOrganization.name = name
  }

  @action
  changeUrl(url) {
    this.editingOrganization.pic_url_square = url
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
    organization.pic_url_square = this.editingOrganization.pic_url_square
    organization.save().then(() => {
      onSave && onSave()
    })
  }

  render() {
    return (
      <form>
        <input
          type="text"
          value={this.editingOrganization.name}
          onChange={this.handleNameChange}
        />
        <OrganizationAvatar
          onClickOverride={this.handleImagePick}
          organization={this.editingOrganization}
        />
        <input
          onClick={this.handleSave}
          type="submit"
          value="save"
        />
      </form>
    )
  }
}

OrganizationEdit.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func,
}

export default OrganizationEdit
