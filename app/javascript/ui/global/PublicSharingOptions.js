import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Fragment } from 'react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'
import CopyToClipboard from 'react-copy-to-clipboard'
import FormControlLabel from '@material-ui/core/FormControlLabel'

import { Checkbox } from '~/ui/global/styled/forms'
import { Heading3, SubText } from '~/ui/global/styled/typography'
import LinkIcon from '~/ui/icons/LinkIcon'
import ProfileIcon from '~/ui/icons/ProfileIcon'

const StyledFormControlLabel = styled(FormControlLabel)`
  margin-top: -10px;
`

const StyledTitle = styled.div`
  margin-bottom: 10px;
  .icon {
    width: 24px;
    margin-right: 10px;
  }
`

const PublicViewLink = styled.div`
  cursor: pointer;
  display: inline-block;
  margin-top: 2px;
  .icon {
    width: 16px;
    transform: translateY(3px);
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

    const { anyoneCanView } = this.state
    const { frontend_url } = record

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
    const { anyoneCanJoin } = this.state
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

    if (!record.isCollection || !canEdit) return <div />

    return (
      <Fragment>
        <StyledTitle>
          <ProfileIcon />
          <SubText>Public Sharing Options</SubText>
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
