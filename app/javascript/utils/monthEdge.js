const monthEdge = (momentDate, timeframe) => {
  const startOfMonth = momentDate.clone().startOf('month')
  const endOfMonth = momentDate.clone().endOf('month')

  const startAllowance = timeframe === 'day' ? 0 : 2
  const endAllowance = timeframe === 'day' ? -1 : 3

  const startDiff = Math.abs(startOfMonth.diff(momentDate, 'days'))
  const endDiff = Math.abs(
    momentDate
      .clone()
      .endOf('month')
      .diff(momentDate, 'days')
  )

  if (startDiff <= startAllowance) {
    // If a date is near the beginning of the month
    // return the previous month
    return startOfMonth.subtract(1, 'month')
  } else if (endDiff <= endAllowance) {
    // If a date is near the end of the month
    // return the end of the month
    return endOfMonth
  }

  return false
}

export default monthEdge
