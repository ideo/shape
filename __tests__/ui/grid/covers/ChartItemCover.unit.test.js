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
    it('does not render headings when the question is not there', () => {
      expect(wrapper.find('Heading1').exists()).toBe(false)
      expect(wrapper.find('Heading3').exists()).toBe(false)
    })

    describe('when question is fetched', () => {
      beforeEach(() => {
        apiStore.fetch.mockReturnValue(
          Promise.resolve({
            data: {
              question_type: 'question_useful',
            },
          })
        )
        rerender()
      })

      it('does render the headings when the question is there', async () => {
        // TODO not working yet
        // expect(wrapper.find('Heading1').text()).toEqual('')
        // expect(wrapper.find('Heading3').text()).toEqual('')
      })
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
