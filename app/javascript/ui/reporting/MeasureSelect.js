import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action, runInAction, observable } from 'mobx'
import styled from 'styled-components'

import ArrowIcon from '~/ui/icons/ArrowIcon'
import { Select, SelectOption } from '~/ui/global/styled/forms'
import v, { DATA_MEASURES } from '~/utils/variables'
import TruncatableText from '~/ui/global/TruncatableText'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'
import CSVUploader from '~/ui/global/CSVUploader'

const contentMeasureValues = ['collections', 'items', 'records']

const shownMeasures = DATA_MEASURES.filter(
  measure => contentMeasureValues.indexOf(measure.value) === -1
)

const contentMeasures = DATA_MEASURES.filter(
  measure => contentMeasureValues.indexOf(measure.value) !== -1
)

const timeframeMeasures = [
  { name: 'month', value: 'month' },
  { name: 'week', value: 'week' },
  { name: 'ever', value: 'ever' },
]

const StyledInlineSelectItem = styled.span`
  display: flex;
  justify-content: space-between;
`

const IconHolder = styled.span`
  display: inline-block;
  width: 10px;
`

const ToggleIconHolder = styled(IconHolder)`
  height: 15px;
  position: absolute;
  right: 15px;
  transform: rotate(${props => (props.open ? '270deg' : '180deg')});
  transition: transform 0.35s;
  top: calc(50% - 6px);
`

const StyledMeasureName = styled.span`
  flex-grow: 1;
`

@observer
class MeasureSelect extends React.Component {
  @observable
  menuOpen = false

  @observable
  contentSectionOpen = false

  @observable
  externalSectionOpen = false

  get currentValue() {
    const { item, dataSettingsName } = this.props
    if (!item) return null
    return item.primaryDataset[dataSettingsName]
  }

  get contentSelected() {
    return contentMeasureValues.indexOf(this.currentValue) !== -1
  }

  @action
  toggleContentSection() {
    this.contentSectionOpen = !this.contentSectionOpen
  }

  @action
  toggleExternalSection() {
    this.externalSectionOpen = !this.externalSectionOpen
  }

  handleOpen = ev => {
    runInAction(() => (this.menuOpen = true))
  }

  handleClose = ev => {
    runInAction(() => (this.menuOpen = false))
  }

  handleChange = ev => {
    ev.preventDefault()
    if (ev.target.value === 'externalMenu') {
      return
    }
    if (ev.target.value === 'contentMenu') {
      this.toggleContentSection()
      runInAction(() => (this.menuOpen = true))
      return
    }
    const { onSelect } = this.props
    if (onSelect) onSelect(ev.target.value)
    runInAction(() => (this.menuOpen = false))
  }

  get measures() {
    const { dataSettingsName } = this.props
    if (dataSettingsName === 'timeframe') return timeframeMeasures
    if (dataSettingsName === 'measure') {
      const measures = [
        { name: 'Select Measure...', value: null },
        ...shownMeasures,
        { name: 'Content', value: 'contentMenu' },
        { name: null, value: 'externalMenu' },
      ]
      if (this.contentSectionOpen || this.contentSelected) {
        measures.push(...contentMeasures)
      }
      return measures
    }
    return []
  }

  renderMeasureNameAndInfo = (measureName, description, menuOpen) => {
    return (
      <StyledInlineSelectItem>
        <StyledMeasureName>
          {measureName && (
            <TruncatableText
              text={measureName}
              maxLength={v.maxSelectMeasureTextLength}
            />
          )}
        </StyledMeasureName>
        {description && (
          <HoverableDescriptionIcon
            description={description}
            width={menuOpen ? 16 : 10}
          />
        )}
      </StyledInlineSelectItem>
    )
  }

  render() {
    const { dataSettingsName } = this.props
    return (
      <form className="form" style={{ display: 'inline-block' }}>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="role"
          onChange={this.handleChange}
          onOpen={this.handleOpen}
          onClose={this.handleClose}
          value={this.currentValue}
          inline
          open={this.menuOpen}
          data-cy={`DataReportSelect-${dataSettingsName}`}
        >
          {this.measures.map(opt => (
            <SelectOption
              classes={{ root: 'selectOption wide', selected: 'selected' }}
              key={opt.value}
              value={opt.value}
              disabled={opt.value === 'contentMenu' && this.contentSelected}
              data-cy={`DataReportOption-${opt.value}`}
            >
              {this.renderMeasureNameAndInfo(
                opt.name,
                opt.description,
                this.menuOpen
              )}
              {opt.value === 'contentMenu' && (
                <ToggleIconHolder
                  open={this.contentSectionOpen || this.contentSelected}
                >
                  <ArrowIcon />
                </ToggleIconHolder>
              )}
              {opt.value === 'externalMenu' && (
                <CSVUploader
                  onFileLoaded={() => {
                    console.log('parse CSV')
                  }}
                />
              )}
            </SelectOption>
          ))}
        </Select>
      </form>
    )
  }
}

MeasureSelect.propTypes = {
  dataSettingsName: PropTypes.string.isRequired,
  item: MobxPropTypes.objectOrObservableObject,
  onSelect: PropTypes.func,
}

MeasureSelect.defaultProps = {
  item: null,
  onSelect: null,
}

export default MeasureSelect
