import moment from 'moment-mini'

const Moment = ({ date, format } = {}) => (
  <span>
    {moment(date).format(format)}
  </span>
)

export default Moment
