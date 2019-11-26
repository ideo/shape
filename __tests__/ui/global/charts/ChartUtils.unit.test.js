import {
  chartDomainForDatasetValues,
  dateTooltipText,
  advancedTooltipText,
  addDuplicateValueIfSingleValue,
  primaryFillColorFromDataset,
  formatValuesForVictory,
} from '~/ui/global/charts/ChartUtils'

describe('ChartUtils', () => {
  describe('advancedTooltipText', () => {
    it('renders text for the label with month and year', () => {
      // NOTE: code pulls the actual month back by 1
      const datum = { date: '2018-10-01', value: 34, month: 'Sep' }
      const tooltip = advancedTooltipText({
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
      const tooltip = advancedTooltipText({
        datum,
        isLastDataPoint: true,
        timefame: 'month',
        measure: 'Participants',
      })
      expect(tooltip).toEqual('34 Participants\nin last 7 days')
    })
  })

  describe('dateTooltipText', () => {
    it('renders {value} on {date}', () => {
      const datum = { date: '2018-10-01', value: 34, month: 'Sep' }
      expect(dateTooltipText(datum)).toEqual('34 on 10/1/2018')
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
      expect(chartDomainForDatasetValues({ values, maxYDomain: 100 })).toEqual({
        x: [1, 2],
        y: [0, 100],
      })
    })

    it('returns date-based domain if in dataset', () => {
      const values = [
        { value: 10, date: new Date(2015, 10, 10) },
        { value: 20, date: new Date(2019, 3, 25) },
        { value: 15, date: new Date(2016, 4, 9) },
      ]
      expect(chartDomainForDatasetValues({ values })).toEqual({
        x: [values[0].date, values[1].date],
        y: [0, 20],
      })
    })
  })

  describe('formatValuesForVictory', () => {
    let data
    beforeEach(() => {
      data = [{ value: 25 }]
    })

    xit('duplicates value n times for use in VictoryLine', () => {
      expect(formatValuesForVictory({ values: data })).toEqual([
        { value: 25 },
        { value: 25, isDuplicate: true },
      ])
    })

    it('adds dates if provided', () => {
      const startDate = '2017-11-01'
      const endDate = '2019-11-01'
      expect(
        formatValuesForVictory({
          values: data,
          addStartDate: startDate,
          addEndDate: endDate,
        })
      ).toEqual([
        { value: 25, date: startDate },
        { value: 25, date: endDate, isDuplicate: true },
      ])
    })
  })

  describe('addDuplicateValueIfSingleValue', () => {
    it('returns empty array if no data', () => {
      const values = []
      expect(addDuplicateValueIfSingleValue(values)).toEqual([])
    })

    it('duplicates if single value provided', () => {
      const values = [{ date: '2018-01-01', value: 25 }]
      const addStartDate = null
      const addEndDate = '2019-10-01'
      expect(
        addDuplicateValueIfSingleValue(values, addStartDate, addEndDate)
      ).toEqual([
        { date: '2018-01-01', value: 25 },
        { date: '2019-10-01', value: 25, isDuplicate: true },
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

  describe('primaryFillColorFromDataset', () => {
    it('returns fill if on primary dataset', () => {
      const dataset = { order: 0, style: { fill: '#EFEFEF' } }
      expect(primaryFillColorFromDataset(dataset)).toEqual('#EFEFEF')
    })

    it('returns #000000 if no fill', () => {
      const dataset = { order: 0 }
      expect(primaryFillColorFromDataset(dataset)).toEqual('#000000')
    })
  })
})
