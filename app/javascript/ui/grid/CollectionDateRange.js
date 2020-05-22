//import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { StaticDateRangePicker } from '@material-ui/pickers'
import moment from 'moment-mini'
import styled from 'styled-components'

import v from '~/utils/variables'
import TextButton from '~/ui/global/TextButton'
import InlineModal from '~/ui/global/modals/InlineModal'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'

const EditIcon = styled.span`
  margin-left: 6px;
  width: 18px;
  cursor: pointer;
  display: inline-block;
  vertical-align: middle;
  svg {
    width: 100%;
  }
`

class CollectionDateRange extends React.Component {
  constructor(props) {
    super(props)
    this.dateDisplayRef = React.createRef()
    this.wrapperRef = React.createRef()
  }

  state = {
    datePickerOpen: false,
    dateRange: [null, null],
    selectedDateRange: [null, null],
  }

  componentDidMount() {
    const { start_date, end_date } = this.props.collection
    if (start_date && end_date) {
      this.setState({ dateRange: [start_date, end_date] })
    }
  }

  handleDateChange = dateRange => {
    this.setState({
      selectedDateRange: dateRange,
    })
  }

  handleConfirmDateChange = e => {
    const { selectedDateRange } = this.state
    this.setState({
      datePickerOpen: false,
      dateRange: selectedDateRange,
    })
    // TODO: Update collection
  }

  handleClearDates = e => {
    e.preventDefault()
    e.stopPropagation()
    this.setState({ dateRange: [null, null] })
  }

  handleCancelDateChange = e => {
    this.setState({ datePickerOpen: false })
  }

  setDatePickerOpen(value) {
    this.setState({ datePickerOpen: value, selectedDateRange: [null, null] })
  }

  stopPropagationToParents = e => {
    const dateRangeWrapper = this.wrapperRef.current
    if (dateRangeWrapper && dateRangeWrapper.contains(e.target)) return
    // Prevent any clicks from bubbling up out of the date range component
    // So that they aren't registered as collection cover clicks
    e.stopPropagation()
  }

  get clearButton() {
    return (
      <TextButton
        onClick={this.handleClearDates}
        fontSizeEm="0.75"
        color={v.colors.black}
      >
        Clear
      </TextButton>
    )
  }

  render() {
    const { dateRange, datePickerOpen } = this.state
    if (dateRange[0] === null || dateRange[1] === null) return ''
    return (
      <div
        ref={this.collectionDateRangeWrapperRef}
        onClick={this.stopPropagationToParents}
        className="cancelGridClick"
      >
        <div
          onClick={() => this.setDatePickerOpen(!datePickerOpen)}
          ref={this.dateDisplayRef}
        >
          {moment(dateRange[0]).format('M.D.YY')}
          {' to '}
          {moment(dateRange[1]).format('M.D.YY')}
          <EditIcon>
            <EditPencilIcon />
          </EditIcon>
        </div>
        <InlineModal
          title={'Pick Dates'}
          onConfirm={this.handleConfirmDateChange}
          onCancel={this.handleCancelDateChange}
          open={datePickerOpen}
          leftButton={this.clearButton}
          anchorElement={this.dateDisplayRef.current}
        >
          <StaticDateRangePicker
            displayStaticWrapperAs="desktop"
            calendars={1}
            value={dateRange}
            onChange={this.handleDateChange}
            DialogProps={{ fullWidth: true }}
            renderInput={(startProps, endProps) => ''}
          />
        </InlineModal>
      </div>
    )
  }
}

CollectionDateRange.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionDateRange
