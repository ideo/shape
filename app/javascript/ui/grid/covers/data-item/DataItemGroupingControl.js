import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action, observable } from 'mobx'
import styled, { css } from 'styled-components'

import { debouncedAutocompleteSearch } from '~/ui/reporting/utils'
import FilterIconSm from '~/ui/icons/FilterIconSm'
import TrashIcon from '~/ui/icons/TrashIcon'
import AutoComplete from '~/ui/global/AutoComplete'

const InlinePaddedBlock = css`
  display: inline-block;
  margin-left: 4px;
`

const StyledGroupControlWrapper = styled.div`
  ${InlinePaddedBlock};
  height: ${props => (props.editingGroup ? '44px' : 'auto')};
`

const StyledGroupControl = styled.div`
  display: inline-block;
  width: ${props => (props.editingGroup ? '180px' : 'auto')};
`
StyledGroupControl.displayName = 'StyledGroupControl'

const StyledTrashIcon = styled.div`
  ${InlinePaddedBlock};
  width: 20px;
  position: relative;
  top: 3px;
`
StyledTrashIcon.displayName = 'StyledTrashIcon'

const StyledFilterIcon = styled.span`
  ${InlinePaddedBlock};
  width: 12px;
`
StyledFilterIcon.displayName = 'StyledFilterIcon'

@observer
class DataItemGroupingControl extends React.Component {
  @observable
  editingGroup = false

  constructor(props) {
    super(props)
    this.debouncedGroupSearch = debouncedAutocompleteSearch('searchGroups')
  }

  componentDidUpdate() {
    if (!this.props.editing) {
      this.toggleEditingGroup(false)
    }
  }

  onGroupSearch = (value, callback) =>
    this.debouncedGroupSearch(value, callback)

  onSelectGrouping = value => {
    const groupings = []
    if (value) {
      // we really only save 1 grouping, and Group is the only type
      groupings.push({
        id: value.id,
        type: 'Group',
      })
    }
    this.props.saveSettings({
      groupings,
    })
  }

  onDeleteGrouping = () => {
    const { group } = this.props
    this.toggleEditingGroup(false)

    if (!group) return
    this.props.saveSettings({
      groupings: [],
    })
  }

  @action
  toggleEditingGroup = (value = true) => {
    this.editingGroup = value
  }

  get trashIcon() {
    const { canEdit } = this.props
    if (!canEdit) return null
    return (
      <StyledTrashIcon
        className="editableMetric"
        onClick={this.onDeleteGrouping}
      >
        <TrashIcon />
      </StyledTrashIcon>
    )
  }

  get filterIcon() {
    const { canEdit } = this.props
    if (!canEdit) return null
    return (
      <StyledFilterIcon
        onClick={this.toggleEditingGroup}
        className="editableMetric"
      >
        <FilterIconSm />
      </StyledFilterIcon>
    )
  }

  get groupControl() {
    const { group } = this.props
    const { editingGroup } = this

    return (
      <Fragment>
        {'from '}
        <StyledGroupControl
          className="editableMetric"
          editingGroup={editingGroup}
        >
          {editingGroup && (
            <AutoComplete
              autoFocus
              options={[]}
              optionSearch={this.onGroupSearch}
              onOptionSelect={option => this.onSelectGrouping(option)}
              placeholder="Group name"
              keepSelectedOptions
            />
          )}
          {!editingGroup && (
            <span onClick={this.toggleEditingGroup}>{group.name}</span>
          )}
        </StyledGroupControl>
        {this.trashIcon}
      </Fragment>
    )
  }

  render() {
    const { group, editing, onEditClick } = this.props
    const { editingGroup } = this

    let contents
    if (group || (editing && editingGroup)) {
      contents = this.groupControl
    } else {
      contents = this.filterIcon
    }
    return (
      <StyledGroupControlWrapper
        onClick={!editing ? onEditClick : null}
        editingGroup={editingGroup}
      >
        {contents}
      </StyledGroupControlWrapper>
    )
  }
}

DataItemGroupingControl.displayName = 'DataItemGroupingControl'

DataItemGroupingControl.propTypes = {
  group: MobxPropTypes.objectOrObservableObject,
  canEdit: PropTypes.bool,
  editing: PropTypes.bool.isRequired,
  onEditClick: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
}

DataItemGroupingControl.defaultProps = {
  group: null,
  canEdit: false,
}

export default DataItemGroupingControl
