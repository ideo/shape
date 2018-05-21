import moment from 'moment-mini'

function defaultFormat(time) {
  const now = moment()
  const m = moment(time)
  if (now.diff(m, 'h') < 24) return 'LT'
  return 'M/DD/YYYY h:mm'
}

const Moment = ({ date } = {}) => (
  <span>
    {moment(date).format(defaultFormat(date))}
  </span>
)

export default Moment
