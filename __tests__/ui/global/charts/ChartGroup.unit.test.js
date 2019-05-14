import ChartGroup from '~/ui/global/charts/ChartGroup'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import { emojiSeriesForQuestionType } from '~/ui/global/charts/ChartUtils'
import { fakeAreaChartDataset, fakeBarChartDataset } from '#/mocks/data'

const props = {}
let wrapper, render

describe('ChartGroup', () => {
  beforeEach(() => {
    props.datasets = [
      fakeAreaChartDataset,
      {
        ...fakeAreaChartDataset,
        order: 1,
        chart_type: 'line',
      },
      {
        ...fakeAreaChartDataset,
        order: 2,
        chart_type: 'bar',
      },
    ]
    props.simpleDateTooltip = true
    render = () => (wrapper = shallow(<ChartGroup {...props} />))
    render()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders charts', () => {
    const chart = wrapper.find('VictoryChart')
    expect(chart.exists()).toBe(true)
    expect(chart.find('VictoryArea').exists()).toBe(true)
    expect(chart.find('VictoryLine').exists()).toBe(true)
    expect(chart.find('VictoryBar').exists()).toBe(true)
    expect(chart.find('VictoryAxis').exists()).toBe(true)
  })

  it('renders axis', () => {
    expect(wrapper.find('VictoryAxis').props().label).toEqual('07/10/18')
  })

  it('displays x-axis labels for dates near the end of the month', () => {
    let label
    // if it's not near month end, the label is blank
    label = wrapper.instance().monthlyXAxisText('2018-10-06')
    expect(label).toEqual('')
    // should display the short name of the month that previously ended
    label = wrapper.instance().monthlyXAxisText('2018-01-02')
    expect(label).toEqual('Dec')
    label = wrapper.instance().monthlyXAxisText('2018-12-31')
    expect(label).toEqual('Dec')
  })

  describe('with a single data point in values', () => {
    beforeEach(() => {
      props.datasets = [fakeAreaChartDataset]
      props.datasets[0].data = [{ value: 24, date: '2018-09-10' }]
      // NOTE: this test passes, but warns:
      // Failed prop type: Invalid prop `domain` supplied to `VictoryBar`
      render()
    })

    it('renders one label on X axis of the chart', () => {
      expect(wrapper.find('VictoryAxis').props().label).toEqual('09/10/18')
    })
  })

  describe('with not enough data', () => {
    beforeEach(() => {
      props.datasets = [fakeAreaChartDataset]
      props.datasets[0].data = []
      render()
    })

    it('renders not enough data message', () => {
      expect(
        wrapper
          .find('.noDataMessage')
          .children()
          .text()
      ).toContain('Not enough data yet')
    })
  })

  describe('with bar column data', () => {
    beforeEach(() => {
      props.datasets = [fakeBarChartDataset]
      render()
    })

    it('renders a BarChart', () => {
      expect(wrapper.find('VictoryBar').exists()).toBe(true)
    })

    it('renders axis with emojis', () => {
      const axis = wrapper.find('VictoryAxis')
      expect(axis.exists()).toBe(true)
      expect(axis.props().tickValues).toEqual([1, 2, 3, 4])
      expect(axis.props().tickLabelComponent.props.emojiScale).toEqual(
        emojiSeriesForQuestionType(fakeBarChartDataset.question_type)
      )
    })
  })
})
