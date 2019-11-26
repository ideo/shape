import chartAxisProps, {
  monthlyXAxisText,
} from '~/ui/global/charts/chartAxisProps'
import _ from 'lodash'
import { fakeAreaChartDataset } from '#/mocks/data'
import { chartDomainForDatasetValues } from '~/ui/global/charts/ChartUtils'

let props = {}
let result
describe('chartAxisProps', () => {
  beforeEach(() => {
    const values = fakeAreaChartDataset.dataWithDates
    props = {
      datasetValues: values,
      datasetTimeframe: 'monthly',
      domain: chartDomainForDatasetValues({ values }),
      isSmallChartStyle: true,
    }
    result = chartAxisProps({ ...props })
  })

  it('returns desired keys', () => {
    expect(_.keys(result)).toEqual(
      expect.arrayContaining([
        'dependentAxis',
        'domain',
        'style',
        'offsetY',
        'axisComponent',
        'tickFormat',
        'tickLabelComponent',
        'orientation',
      ])
    )
  })

  describe('with 1 value', () => {
    beforeEach(() => {
      props.datasetValues = [props.datasetValues[0]]
      result = chartAxisProps({ ...props })
    })

    it('returns single value props', () => {
      expect(_.keys(result)).toEqual(
        expect.arrayContaining([
          'dependentAxis',
          'domain',
          'style',
          'offsetY',
          'axisComponent',
          'tickFormat',
          'axisLabelComponent',
          'label',
        ])
      )
    })
  })

  describe('monthlyXAxisText', () => {
    it('displays x-axis labels for dates near the end of the month', () => {
      let label
      // if it's not near month end, the label is blank
      label = monthlyXAxisText(props.datasetValues, 'monthly', '2018-10-06')
      expect(label).toEqual('')
      // should display the short name of the month that previously ended
      label = monthlyXAxisText(props.datasetValues, 'monthly', '2018-01-02')
      expect(label).toEqual('Dec')
      label = monthlyXAxisText(props.datasetValues, 'monthly', '2018-12-31')
      expect(label).toEqual('Dec')
    })
  })
})
