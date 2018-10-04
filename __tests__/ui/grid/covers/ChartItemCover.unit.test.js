import ChartItemCover from '~/ui/grid/covers/ChartItemCover'
import { apiStore } from '~/stores'

import { fakeChartItem } from '#/mocks/data'

jest.mock('../../../../app/javascript/stores')

let props, wrapper, rerender, component
describe('ChartItemCover', () => {
  beforeEach(() => {
    props = {
      item: fakeChartItem,
    }
    rerender = () => {
      wrapper = shallow(<ChartItemCover {...props} />)
      component = wrapper.instance()
    }
    rerender()
  })

  describe('render()', () => {
    it('renders the question title and full question when there', () => {
      expect(wrapper.find('Heading1').exists()).toBe(false)
      expect(wrapper.find('Heading3').exists()).toBe(false)
    })

    it('renders a victory bar chart with formatted data', () => {
      expect(wrapper.find('VictoryBar').props().data).toEqual(
        component.formattedData
      )
    })
  })

  describe('formattedData', () => {
    it('formats the data into an array as percentages of totals', () => {
      expect(component.formattedData).toEqual([
        { scale: '0', value: 16 },
        { scale: '1', value: 33 },
        { scale: '2', value: 5 },
        { scale: '3', value: 44 },
      ])
    })
  })

  describe('fetchQuestionItem()', () => {
    it('fetches the question item', () => {
      expect(apiStore.fetch).toHaveBeenCalledWith('items', 3)
    })
  })
})
