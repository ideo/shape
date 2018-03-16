import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Avatar from 'material-ui/Avatar'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledAvatar = styled(Avatar)`
  &.orgAvatar {
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    margin-left: 5px;
    margin-right: 5px;
    cursor: pointer;

    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      width: ${props => props.size * 0.8}px;
      height: ${props => props.size * 0.8}px;
    }
  }
`

const DEFAULT_URL = 'https://cdn.filestackcontent.com/XYWsMijFTDWBsGzzKEEo'

@inject('uiStore')
@observer
class OrganizationAvatar extends React.Component {
  handleClick = (ev) => {
    const { uiStore, organization } = this.props
    uiStore.openOrganizationMenu(organization)
  }

  render() {
    const { organization, size } = this.props
    const url = organization.pic_url_square || DEFAULT_URL
    return (
      <StyledAvatar
        size={size}
        onClick={this.handleClick}
        className="orgAvatar"
        src={url}
      />
    )
  }
}

OrganizationAvatar.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  size: PropTypes.number,
}
OrganizationAvatar.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationAvatar.defaultProps = {
  size: 34,
}

export default OrganizationAvatar
