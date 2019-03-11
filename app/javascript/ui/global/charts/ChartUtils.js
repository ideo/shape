import PropTypes from 'prop-types'
import moment from 'moment-mini'
import styled from 'styled-components'
import v from '~/utils/variables'

export const utcMoment = date => moment(`${date} 00+0000`).utc()

export const datasetPropType = PropTypes.arrayOf(
  PropTypes.shape({
    measure: PropTypes.string.isRequired,
    description: PropTypes.string,
    chart_type: PropTypes.string.isRequired,
    timeframe: PropTypes.string.isRequired,
    primary: PropTypes.bool.isRequired,
    fill: PropTypes.string,
    max_domain: PropTypes.number,
    single_value: PropTypes.number,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.number.isRequired,
        date: PropTypes.string.isRequired,
      })
    ),
  })
)

export const primaryFillColorFromDatasets = datasets => {
  if (!datasets) return '#000000'
  const primary = datasets.filter(dataset => dataset.primary)
  return primary ? primary.chartFill : '#000000'
}

export const AboveChartContainer = styled.div`
  position: absolute;
  z-index: ${v.zIndex.aboveVictoryChart};
`
