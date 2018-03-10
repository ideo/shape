import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import AddImageIcon from '~/ui/icons/AddImageIcon'
import Divider from 'material-ui/Divider';
import FilestackUpload from '~/utils/FilestackUpload'
import OrganizationAvatar from '~/ui/layout/OrganizationAvatar'
import v from '~/utils/variables'

// TODO remove duplication with GridCardBlank
const BctButton = styled.button`
  position: relative;
  width: 47px;
  height: 47px;
  border-radius: 50%;
  background: ${v.colors.blackLava};
  color: white;

  &:hover {
    background-color: ${v.colors.gray};
  }

  .icon {
    position: absolute;
    left: 0;
    top: 0;
    width: 47px;
    height: 47px;
  }
`
BctButton.displayName = 'BctButton'

const StyledFieldBox = styled.div`
  padding: 15px;

  label {
    margin-right: 15px;
  }
`
StyledFieldBox.displayName = 'StyledFieldBox'

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
        <Divider />
        <StyledFieldBox>
          <label htmlFor="organizationName">Name</label>
          <input
            id="organizationName"
            type="text"
            value={this.editingOrganization.name}
            onChange={this.handleNameChange}
          />
        </StyledFieldBox>
        <Divider />
        <StyledFieldBox>
          <label htmlFor="organizationAvatar">Avatar</label>
          <BctButton onClick={this.handleImagePick} id="organizationAvatar">
            <AddImageIcon width="32" height="32" color="white" />
          </BctButton>
        </StyledFieldBox>
        <Divider />
        <StyledFieldBox>
          <input
            onClick={this.handleSave}
            type="submit"
            value="save"
          />
        </StyledFieldBox>
      </form>
    )
  }
}

OrganizationEdit.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  onSave: PropTypes.func,
}

export default OrganizationEdit
