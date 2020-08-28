import ChartGroup from '~/ui/global/charts/ChartGroup'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { emojiSeriesForQuestionType } from '~/ui/global/charts/ChartUtils'
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
    props.width = 2
    props.height = 2
    props.routingStore = fakeRoutingStore
    render = () =>
      (wrapper = shallow(<ChartGroup.wrappedComponent {...props} />))
    render()
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
      expect(wrapper.find('VictoryAxis').props().label).toEqual('Q3 2018')
    })
  })

  describe('with a Creative Difference chart', () => {
    describe('axisFilteredDateValues()', () => {
      let overlappingLabels
      let labels = []

      beforeEach(() => {
        // This data was generated from a real-world use case.
        labels = [
          {
            datum: new Date('Sat Dec 31 2016 16:00:00 (GMT)'),
            text: 'Q1 2017',
            x: 50,
          },
          {
            datum: new Date('Thu Mar 30 2017 17:00:00 (GMT)'),
            text: 'Q1 2017',
            x: 92.72,
          },
          {
            datum: new Date('Thu Jul 19 2018 17:00:00 (GMT)'),
            text: 'Q3 2018',
            x: 321.2,
          },
          {
            datum: new Date('Sun Sep 30 2018 17:00:00 (GMT)'),
            text: 'Q4 2018',
            x: 356.31,
          },
          {
            datum: new Date('Mon Dec 17 2018 16:00:00 (GMT)'),
            text: 'Q4 2018',
            x: 393.75,
          },
          {
            datum: new Date('Sun Dec 30 2018 16:00:00 (GMT)'),
            text: 'Q4 2018',
            x: 400,
          },
        ]

        overlappingLabels = wrapper
          .instance()
          .findOverlappingLabels(labels)
          .map(d => d.datum.toLocaleDateString('en-US'))
      })

      it('should return filtered date values for overlapping', () => {
        expect(overlappingLabels.sort()).toEqual(
          ['7/19/2018', '9/30/2018', '12/17/2018'].sort()
        )
      })
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
