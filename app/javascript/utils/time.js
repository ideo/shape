import moment from 'moment-mini'

function defaultFormat(time) {
  const now = moment()
  const m = moment(time)
  if (now.diff(m, 'h') < 24) {
    // 4:32pm
    return 'LT'
  } else if (now.diff(m, 'h') >= 24 && now.diff(m, 'days') < 365) {
    // Nov 28th
    return 'MMM Do'
  }
  // Nov 28th, 2017
  return 'MMM Do, YYYY'
}

export function defaultTimeFormat(time) {
  return moment(time).format(defaultFormat(time))
}
