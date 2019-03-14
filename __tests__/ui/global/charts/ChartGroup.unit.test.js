import ChartGroup from '~/ui/global/charts/ChartGroup'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import { fakeDataset } from '#/mocks/data'

const props = {}
let wrapper, render

describe('ChartGroup', () => {
  beforeEach(() => {
    props.datasets = [
      fakeDataset,
      {
        ...fakeDataset,
        primary: false,
        chart_type: 'line',
      },
    ]
    props.showMeasureInTooltip = true
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
      props.datasets[0].data = [{ amount: 24, date: '2018-09-10' }]
      props.datasets[1].data = [{ amount: 24, date: '2018-09-10' }]
      render()
    })

    it('renders one label on X axis of the chart', () => {
      expect(wrapper.find('VictoryAxis').props().label).toEqual('09/10/18')
    })
  })

  describe('with not enough data', () => {
    beforeEach(() => {
      props.datasets[0].data = []
      props.datasets[1].data = []
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
})
