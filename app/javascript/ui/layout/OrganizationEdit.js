import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FilestackUpload from '~/utils/FilestackUpload'
import OrganizationAvatar from '~/ui/layout/OrganizationAvatar'

@observer
class OrganizationEdit extends React.Component {

  handleNameChange = (ev) => {
    // this.changeName(ev.target.value)
    this.props.organization.name = ev.target.value
  }

  handleImagePick = (ev) => {
    FilestackUpload
      .pickImage()
      .then(resp => {
        if (resp.filesUploaded.length > 0) {
          const img = resp.filesUploaded[0]
          this.props.organization.pic_url_square = img.url
        } else {
          console.warn('Failed to upload image:', resp.filesFailed)
        }
      })
  }

  handleSave = (ev) => {
    ev.preventDefault()
    const { organization, onSave } = this.props
    console.log('organization', organization)
    organization.save().then(() => {
      onSave && onSave()
    })
  }

  render() {
    const { organization } = this.props
    return (
      <form>
        <input
          type="text"
          value={organization.name}
          onChange={this.handleNameChange}
        />
        <OrganizationAvatar
          onClickOverride={this.handleImagePick}
          organization={organization}
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
