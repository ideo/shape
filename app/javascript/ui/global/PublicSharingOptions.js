import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Fragment } from 'react'
import { Flex, Box } from 'reflexbox'
import styled from 'styled-components'
import CopyToClipboard from 'react-copy-to-clipboard'
import FormControlLabel from '@material-ui/core/FormControlLabel'

import { Checkbox } from '~/ui/global/styled/forms'
import { Heading3, SmallHelperText } from '~/ui/global/styled/typography'
import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import LinkIcon from '~/ui/icons/LinkIcon'
import PublicSharingIcon from '~/ui/icons/PublicSharingIcon'
import AutoComplete from '~/ui/global/AutoComplete'
import v from '~/utils/variables'
import trackError from '~/utils/trackError'

const StyledFormControlLabel = styled(FormControlLabel)`
  margin-top: -18px;
`

const StyledGroupShowSelect = styled(SmallHelperText)`
  margin-left: 10px;
  color: ${v.colors.commonDarkest};
  cursor: pointer;
  &:hover {
    color: ${v.colors.secondaryDarkest};
  }
  .icon {
    width: 24px;
    margin-left: 5px;
    ${props =>
      props.menuOpen
        ? 'transform: translateY(-2px);'
        : 'transform: rotate(-90deg) translateY(2px);'};
  }
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
    sharingOptionsVisible: false,
    showJoinableGroupSearch: false,
    joinableGroup: null,
  }

  constructor(props) {
    super(props)
    this.debouncedGroupSearch = _.debounce(this._groupSearch, 350)
    this.state.sharingOptionsVisible = props.startMenuOpen
  }

  componentDidMount() {
    const {
      record: { anyone_can_view, anyone_can_join },
    } = this.props
    this.loadJoinableGroup()
    this.setState({
      anyoneCanView: anyone_can_view,
      anyoneCanJoin: anyone_can_join,
    })
  }

  componentDidUpdate() {
    this.loadJoinableGroup()
  }

  _groupSearch = (term, callback) => {
    const {
      apiStore,
      apiStore: { uiStore },
    } = this.props
    if (!term) {
      uiStore.autocompleteMenuClosed()
      callback()
      return
    }
    apiStore
      .searchGroups({ query: term })
      .then(res => {
        uiStore.update('autocompleteValues', res.data.length)
        callback(this.mapGroups(res.data))
      })
      .catch(e => {
        trackError(e)
      })
  }

  mapGroups = searchableGroups =>
    searchableGroups.map(group => {
      return {
        value: group.handle || group.name,
        label: group.name,
        data: group,
      }
    })

  loadJoinableGroup = async () => {
    const { joinableGroup } = this.state
    const { joinable_group_id } = this.props.record
    if (!joinable_group_id) return
    if (joinableGroup && joinableGroup.id === joinable_group_id) return
    const { apiStore } = this.props
    const groupData = await apiStore.fetch('groups', joinable_group_id)
    this.setState({
      joinableGroup: groupData.data,
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

  toggleSharingOptionsVisible = () => {
    this.setState(prevState => ({
      ...prevState,
      sharingOptionsVisible: !prevState.sharingOptionsVisible,
    }))
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
          'All content in this collection and any nested collections will be available to anyone with this link. Are you sure you want to share this content?',
        confirmText: 'Continue',
        iconName: 'Alert',
        onConfirm: this.toggleAnyoneCanView,
      })
    } else {
      // Otherwise immediately toggle off
      this.toggleAnyoneCanView()
    }
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

  onGroupSelected = async group => {
    if (!group) return
    const { record, reloadGroups } = this.props
    record.joinable_group_id = group.id
    await record.save()
    reloadGroups()
    this.setState({
      joinableGroup: group,
      showJoinableGroupSearch: false,
    })
  }

  onGroupSearch = (value, callback) =>
    this.debouncedGroupSearch(value, callback)

  toggleShowJoinableGroupSearch = () => {
    const { showJoinableGroupSearch } = this.state
    this.setState({
      showJoinableGroupSearch: !showJoinableGroupSearch,
    })
  }

  get renderJoinGroupSelection() {
    const { joinableGroup, showJoinableGroupSearch } = this.state
    return (
      <Box
        style={{ marginLeft: 20, marginBottom: 30, width: '40%' }}
        data-cy="public-joinable-group-toggle"
      >
        <Flex align="center">
          {joinableGroup && <EntityAvatarAndName entity={joinableGroup} />}
          <StyledGroupShowSelect
            menuOpen={showJoinableGroupSearch}
            onClick={this.toggleShowJoinableGroupSearch}
          >
            Change
          </StyledGroupShowSelect>
        </Flex>
        {showJoinableGroupSearch && (
          <Box style={{ marginTop: 10, width: 250 }}>
            <AutoComplete
              options={[]}
              optionSearch={this.onGroupSearch}
              onOptionSelect={this.onGroupSelected}
              placeholder="search groups"
              menuPlacement="bottom"
              menuStyles={{ width: '250px', zIndex: 10 }}
              numOptionsToShow={5.5}
            />
          </Box>
        )}
      </Box>
    )
  }

  get renderAnyoneCanJoin() {
    const { anyoneCanJoin, sharingOptionsVisible } = this.state
    if (!anyoneCanJoin && !sharingOptionsVisible) return

    return (
      <Fragment>
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
        {anyoneCanJoin && this.renderJoinGroupSelection}
      </Fragment>
    )
  }

  get renderAnyoneCanView() {
    const {
      record,
      apiStore: { uiStore },
    } = this.props

    const { anyoneCanView, sharingOptionsVisible } = this.state
    const { frontendUrl } = record
    if (!anyoneCanView && !sharingOptionsVisible) return

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
          data-cy="anyone-can-view-checkbox"
          label={`Allow anyone with this link to view (${
            anyoneCanView ? 'ON' : 'OFF'
          })`}
        />
        {anyoneCanView && (
          <CopyToClipboard text={frontendUrl}>
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

  render() {
    const { record, canEdit } = this.props
    const { sharingOptionsVisible } = this.state

    if (!record.isCollection || !canEdit) return <div />
    const color = sharingOptionsVisible
      ? v.colors.commonDarkest
      : v.colors.commonDark

    return (
      <Fragment>
        <StyledTitle
          onClick={this.toggleSharingOptionsVisible}
          color={color}
          data-cy="public-sharing-options-title"
        >
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
  startMenuOpen: PropTypes.bool,
}

PublicSharingOptions.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  startMenuOpen: false,
}

export default PublicSharingOptions
