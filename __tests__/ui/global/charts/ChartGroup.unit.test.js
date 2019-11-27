import ChartGroup from '~/ui/global/charts/ChartGroup'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import {
  emojiSeriesForQuestionType,
  utcMoment,
} from '~/ui/global/charts/ChartUtils'
import {
  fakeDataItem,
  fakeAreaChartDataset,
  fakeBarChartDataset,
} from '#/mocks/data'

const props = {}
let wrapper, render, dataItem

describe('ChartGroup', () => {
  beforeEach(() => {
    dataItem = {
      ...fakeDataItem,
    }
    const secondaryDataset = {
      ...fakeAreaChartDataset,
      order: 1,
      chart_type: 'line',
    }
    dataItem.datasets = [fakeAreaChartDataset, secondaryDataset]
    dataItem.primaryDataset = fakeAreaChartDataset
    dataItem.secondaryDatasets.mockReturnValue([{ ...secondaryDataset }])
    props.dataItem = dataItem
    props.simpleDateTooltip = true
    props.width = 1
    props.height = 1
    props.routingStore = fakeRoutingStore
    render = () =>
      (wrapper = shallow(<ChartGroup.wrappedComponent {...props} />))
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

  describe('with a single data point in values', () => {
    beforeEach(() => {
      const dataset = fakeAreaChartDataset
      dataset.data = [fakeAreaChartDataset.data[0]]
      dataset.dataWithDates = [fakeAreaChartDataset.dataWithDates[0]]
      dataItem.datasets = [dataset]
      props.dataItem.primaryDataset = dataset
      props.dataItem.secondaryDatasets.mockReturnValue([])
      render()
    })

    it('renders one label on X axis of the chart', () => {
      expect(wrapper.find('VictoryAxis').props().label).toEqual(
        utcMoment(fakeAreaChartDataset.data[0].date).format('MM/DD/YY')
      )
    })
  })

  describe('secondary dataset of an area chart', () => {
    beforeEach(() => {
      dataItem.datasets = [
        {
          ...fakeAreaChartDataset,
          order: 2,
          chart_type: 'bar',
        },
      ]
      dataItem.primaryDataset = fakeAreaChartDataset
      dataItem.secondaryDatasets.mockReturnValue([dataItem.datasets[1]])
    })

    it('should render as a line chart always', () => {
      const chart = wrapper.find('VictoryChart')
      expect(chart.find('VictoryLine').exists()).toBe(true)
    })
  })

  describe('with not enough data', () => {
    beforeEach(() => {
      props.dataItem.primaryDataset.data = []
      props.dataItem.primaryDataset.dataWithDates = []
      props.dataItem.secondaryDatasets = () => []
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
      props.dataItem.datasets = [fakeBarChartDataset]
      props.dataItem.primaryDataset = fakeBarChartDataset
      props.dataItem.primaryDataset.isEmojiOrScaleQuestion.mockReset()
      props.dataItem.primaryDataset.isEmojiOrScaleQuestion.mockReturnValue(true)
      props.dataItem.secondaryDatasets = () => []
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

  describe('routeToSearch', () => {
    it('calls routingStore', () => {
      wrapper
        .instance()
        .routeToSearch('test_answer(test_3_question_excitement_answer_3)')
      expect(props.routingStore.routeTo).toHaveBeenCalledWith(
        'search',
        'test_answer(test_3_question_excitement_answer_3)'
      )
    })
  })
})
