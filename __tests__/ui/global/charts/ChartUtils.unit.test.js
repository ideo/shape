import {
  chartDomainForDatasetValues,
  renderTooltip,
  addDuplicateValueIfSingleValue,
  primaryFillColorFromDatasets,
} from '~/ui/global/charts/ChartUtils'

describe('ChartUtils', () => {
  describe('renderTooltip', () => {
    it('renders text for the label with month and year', () => {
      // NOTE: code pulls the actual month back by 1
      const datum = { date: '2018-10-01', value: 34, month: 'Sep' }
      const tooltip = renderTooltip({
        datum,
        isLastDataPoint: false,
        timefame: 'month',
        measure: 'Participants',
      })
      expect(tooltip).toEqual('34 Participants\nSep 30 - Oct 1')
    })

    it('renders in last 30 days for label for last data item', () => {
      // NOTE: code pulls the actual month back by 1
      const datum = { date: '2018-10-01', value: 34, month: 'Sep' }
      const tooltip = renderTooltip({
        datum,
        isLastDataPoint: true,
        timefame: 'month',
        measure: 'Participants',
      })
      expect(tooltip).toEqual('34 Participants\nin last 7 days')
    })
  })

  describe('chartDomainForDatasetValues', () => {
    it('returns max of values if no max specified', () => {
      const values = [{ value: 10 }, { value: 20 }]
      expect(chartDomainForDatasetValues({ values })).toEqual({
        x: [1, 2],
        y: [0, 20],
      })
    })

    it('returns max given', () => {
      const values = [{ value: 10 }, { value: 20 }]
      expect(chartDomainForDatasetValues({ values, maxDomain: 100 })).toEqual({
        x: [1, 2],
        y: [0, 100],
      })
    })
  })

  describe('addDuplicateValueIfSingleValue', () => {
    it('returns empty array if no data', () => {
      const values = []
      expect(addDuplicateValueIfSingleValue(values)).toEqual([])
    })

    it('duplicates if single value provided', () => {
      const values = [{ date: '2019-01-01', value: 25 }]
      expect(addDuplicateValueIfSingleValue(values)).toEqual([
        { date: '2018-10-01', value: 25, isDuplicate: true },
        { date: '2019-01-01', value: 25 },
      ])
    })

    it('does not alter if multiple values provided', () => {
      const values = [
        { date: '2019-01-01', value: 25 },
        { date: '2019-02-01', value: 25 },
      ]
      expect(addDuplicateValueIfSingleValue(values)).toEqual(values)
    })
  })

  describe('primaryFillColorFromDatasets', () => {
    it('returns fill if on primary dataset', () => {
      const datasets = [
        { primary: true, style: { fill: '#EFEFEF' } },
        { primary: false, style: { fill: '#330000' } },
      ]
      expect(primaryFillColorFromDatasets(datasets)).toEqual('#EFEFEF')
    })

    it('returns #000000 if no fill', () => {
      const datasets = [
        { primary: true },
        { primary: false, style: { fill: '#330000' } },
      ]
      expect(primaryFillColorFromDatasets(datasets)).toEqual('#000000')
    })
  })
})
