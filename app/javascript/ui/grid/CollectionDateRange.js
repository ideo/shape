import { PropTypes as MobxPropTypes } from 'mobx-react'
import { StaticDateRangePicker } from '@material-ui/pickers'
import moment from 'moment-mini'
import styled from 'styled-components'
import { Fragment, useState } from 'react'

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

// dateRange is an array of [date, date]
export const formatDateRange = dateRange => {
  if (dateRange[0] === null && dateRange[1] === null) {
    return 'No dates selected'
  } else {
    return (
      <Fragment>
        {moment(dateRange[0]).format('M.D.YY')}
        {' to '}
        {moment(dateRange[1]).format('M.D.YY')}
      </Fragment>
    )
  }
}

const CollectionDateRange = props => {
  const dateDisplayRef = React.createRef()
  const wrapperRef = React.createRef()

  const { collection } = props
  const [dateRange, setDateRange] = useState([
    collection.start_date,
    collection.end_date,
  ])
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState([null, null])
  const [previousDateRange, setPreviousDateRange] = useState(null)

  const handleConfirmDateChange = e => {
    setDatePickerOpen(false)
    setDateRange(selectedDateRange)
    collection.start_date = selectedDateRange[0]
    collection.end_date = selectedDateRange[1]
    collection.save()
  }

  const handleClearDates = e => {
    e.preventDefault()
    e.stopPropagation()
    setPreviousDateRange(dateRange)
    setDateRange([null, null])
    setSelectedDateRange([null, null])
  }

  const handleCancelDateChange = () => {
    // If there was a previous value, and they've now canceled clearing the value,
    // restore the original value
    if (previousDateRange && dateRange[0] === null) {
      setDateRange(previousDateRange)
    }
    setDatePickerOpen(false)
  }

  const openDatePicker = () => {
    setDatePickerOpen(true)
    setSelectedDateRange([null, null])
    setPreviousDateRange([null, null])
  }

  const stopEventPropagationToParents = ev => {
    const dateRangeWrapper = wrapperRef.current
    if (dateRangeWrapper && dateRangeWrapper.contains(ev.target)) return
    // Prevent any clicks from bubbling up out of the date range component
    // So that they aren't registered as collection cover clicks
    ev.stopPropagation()
  }

  return (
    <div
      ref={wrapperRef}
      onClick={stopEventPropagationToParents}
      className="cancelGridClick"
    >
      <div
        onClick={openDatePicker}
        ref={dateDisplayRef}
        className="date-range-wrapper"
      >
        {formatDateRange(dateRange)}
        <EditIcon>
          <EditPencilIcon />
        </EditIcon>
      </div>
      <InlineModal
        title={'Pick Dates'}
        onConfirm={handleConfirmDateChange}
        onCancel={handleCancelDateChange}
        open={datePickerOpen}
        leftButton={
          <TextButton
            onClick={handleClearDates}
            fontSizeEm={0.75}
            color={v.colors.black}
          >
            Clear
          </TextButton>
        }
        anchorElement={dateDisplayRef.current}
      >
        <StaticDateRangePicker
          displayStaticWrapperAs="desktop"
          calendars={1}
          value={dateRange}
          onChange={dateRange => setSelectedDateRange(dateRange)}
          DialogProps={{ fullWidth: true }}
          renderInput={(startProps, endProps) => ''}
        />
      </InlineModal>
    </div>
  )
}

CollectionDateRange.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionDateRange
