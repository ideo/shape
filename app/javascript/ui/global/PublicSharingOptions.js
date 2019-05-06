import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Fragment } from 'react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'
import CopyToClipboard from 'react-copy-to-clipboard'
import FormControlLabel from '@material-ui/core/FormControlLabel'

import { Checkbox } from '~/ui/global/styled/forms'
import { Heading3, SmallHelperText } from '~/ui/global/styled/typography'
import LinkIcon from '~/ui/icons/LinkIcon'
import PublicSharingIcon from '~/ui/icons/PublicSharingIcon'
import v from '~/utils/variables'

const StyledFormControlLabel = styled(FormControlLabel)`
  margin-top: -18px;
`

const StyledTitle = styled.div`
  cursor: pointer;
  color: ${props => props.color};
  &:hover {
    color: ${v.colors.commonDarkest};
  }
  margin-bottom: 6px;
  .icon {
    width: 28px;
    margin-right: 6px;
  }
  span {
    display: inline-block;
  }
`

const PublicViewLink = styled.div`
  cursor: pointer;
  display: inline-block;
  position: relative;
  top: -3px;
  .icon {
    width: 16px;
    position: relative;
    top: 3px;
  }
  .text {
    display: inline-block;
    margin-left: 7px;
  }
`
PublicViewLink.displayName = 'PublicViewLink'

@inject('apiStore')
@observer
class PublicSharingOptions extends React.Component {
  state = {
    anyoneCanView: false,
    anyoneCanJoin: false,
    sharingOptionsOpen: false,
  }

  componentDidMount() {
    const {
      record: { anyone_can_view, anyone_can_join },
    } = this.props
    this.setState({
      anyoneCanView: anyone_can_view,
      anyoneCanJoin: anyone_can_join,
    })
  }

  toggleAnyoneCanView = () => {
    const { record } = this.props
    const { anyoneCanView } = this.state
    record.anyone_can_view = !anyoneCanView
    record.save()
    this.setState({
      anyoneCanView: !anyoneCanView,
    })
  }

  toggleSharingMenuOpen = () => {
    this.setState(prevState => ({
      ...prevState,
      sharingOptionsOpen: !prevState.sharingOptionsOpen,
    }))
  }

  handleAnyoneCanJoinToggle = async () => {
    const { anyoneCanJoin } = this.state
    const { record, reloadGroups } = this.props
    record.anyone_can_join = !anyoneCanJoin
    if (!record.anyone_can_join) record.joinable_group_id = null
    await record.save()
    reloadGroups()
    this.setState({
      anyoneCanJoin: !anyoneCanJoin,
    })
  }

  handleAnyoneCanViewToggle = () => {
    const { anyoneCanView } = this.state
    const {
      apiStore: { uiStore },
    } = this.props
    if (!anyoneCanView) {
      // Show dialog if they are toggling on
      uiStore.confirm({
        prompt:
          'This content will be available to anyone with this link. Are you sure you want to share this content?',
        confirmText: 'Continue',
        iconName: 'Alert',
        onConfirm: this.toggleAnyoneCanView,
      })
    } else {
      // Otherwise immediately toggle off
      this.toggleAnyoneCanView()
    }
  }

  get renderAnyoneCanView() {
    const {
      record,
      apiStore: { uiStore },
    } = this.props

    const { anyoneCanView, sharingOptionsOpen } = this.state
    const { frontend_url } = record
    if (!anyoneCanView && !sharingOptionsOpen) return

    return (
      <Flex align="center" style={{ marginBottom: 5 }}>
        <StyledFormControlLabel
          classes={{ label: 'form-control' }}
          control={
            <Checkbox
              checked={anyoneCanView}
              onChange={this.handleAnyoneCanViewToggle}
              value="yes"
            />
          }
          data-cy="viewable-by-anyone-checkbox"
          label={`Allow anyone with this link to view (${
            anyoneCanView ? 'ON' : 'OFF'
          })`}
        />
        {anyoneCanView && (
          <CopyToClipboard text={frontend_url}>
            <PublicViewLink
              aria-label="Get link"
              onClick={() => uiStore.popupSnackbar({ message: 'Link Copied' })}
              data-cy="anyone-can-view-link"
            >
              <LinkIcon className="icon" />
              <Heading3 className="text">Get Link</Heading3>
            </PublicViewLink>
          </CopyToClipboard>
        )}
      </Flex>
    )
  }

  get renderAnyoneCanJoin() {
    const { anyoneCanJoin, sharingOptionsOpen } = this.state
    if (!anyoneCanJoin && !sharingOptionsOpen) return

    return (
      <Flex align="center" style={{ marginBottom: 5 }}>
        <StyledFormControlLabel
          classes={{ label: 'form-control' }}
          control={
            <Checkbox
              checked={anyoneCanJoin}
              onChange={this.handleAnyoneCanJoinToggle}
              value="yes"
            />
          }
          data-cy="anyone-can-join-checkbox"
          label={`Public can join this collection (${
            anyoneCanJoin ? 'ON' : 'OFF'
          })`}
        />
      </Flex>
    )
  }

  render() {
    const { record, canEdit } = this.props
    const { sharingOptionsOpen } = this.state

    if (!record.isCollection || !canEdit) return <div />
    const color = sharingOptionsOpen
      ? v.colors.commonDarkest
      : v.colors.commonDark

    return (
      <Fragment>
        <StyledTitle onClick={this.toggleSharingMenuOpen} color={color}>
          <PublicSharingIcon />
          <SmallHelperText
            style={{ position: 'relative', top: '-10px' }}
            color={color}
          >
            Public Sharing Options
          </SmallHelperText>
        </StyledTitle>
        {this.renderAnyoneCanView}
        {this.renderAnyoneCanJoin}
      </Fragment>
    )
  }
}

PublicSharingOptions.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool.isRequired,
  reloadGroups: PropTypes.func.isRequired,
}

PublicSharingOptions.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default PublicSharingOptions
