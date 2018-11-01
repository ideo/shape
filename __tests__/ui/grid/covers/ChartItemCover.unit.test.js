import ChartItemCover from '~/ui/grid/covers/ChartItemCover'
import { apiStore } from '~/stores'

import { fakeChartItem, fakeCollection } from '#/mocks/data'

jest.mock('../../../../app/javascript/stores')

let props, wrapper, rerender, component

describe('ChartItemCover', () => {
  beforeEach(() => {
    props = {
      item: fakeChartItem,
      testCollection: fakeCollection,
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
        component.question = { id: 53, question_type: 'question_useful' }
        wrapper.update()
      })

      it('does render the headings when the question is there', async () => {
        expect(
          wrapper
            .find('Heading1')
            .children()
            .text()
        ).toEqual('Usefulness')
        expect(
          wrapper
            .find('StyledHeading3')
            .children()
            .text()
        ).toEqual('How useful is this idea for you?')
      })

      describe('when question is a category satisfaction question', () => {
        beforeEach(() => {
          component.question = {
            id: 53,
            question_type: 'question_category_satisfaction',
            content: 'donut',
          }
          wrapper.update()
        })

        it('should render the category satisfaction filled-in field', () => {
          expect(
            wrapper
              .find('StyledHeading3')
              .children()
              .text()
          ).toEqual('How satisifed are you with your current donut')
        })
      })
    })

    it('renders a victory bar chart with formatted data', () => {
      expect(
        wrapper
          .find('VictoryBar')
          .first()
          .props().data
      ).toEqual(component.formattedData.datasets[0].data)
    })

    it('renders a legend with org and test collection name', () => {
      expect(
        wrapper
          .find('VictoryLegend')
          .first()
          .props().data
      ).toEqual([
        { name: fakeCollection.name },
        { name: 'Acme Inc Organization' },
      ])
    })
  })

  describe('formattedData', () => {
    it('formats the data into an array as percentages of totals', () => {
      expect(component.formattedData).toEqual({
        datasets: [
          {
            data: [
              {
                answer: 1,
                num_responses: 2,
                percentage: 28,
                total: 7,
                type: 'question_items',
              },
              {
                answer: 2,
                num_responses: 2,
                percentage: 28,
                total: 7,
                type: 'question_items',
              },
              {
                answer: 3,
                num_responses: 0,
                percentage: 0,
                total: 7,
                type: 'question_items',
              },
              {
                answer: 4,
                num_responses: 3,
                percentage: 42,
                total: 7,
                type: 'question_items',
              },
            ],
            label: 'Super test',
            total: 7,
            type: 'question_items',
          },
          {
            data: [
              {
                answer: 1,
                num_responses: 5,
                percentage: 10,
                total: 50,
                type: 'org_wide',
              },
              {
                answer: 2,
                num_responses: 10,
                percentage: 20,
                total: 50,
                type: 'org_wide',
              },
              {
                answer: 3,
                num_responses: 20,
                percentage: 40,
                total: 50,
                type: 'org_wide',
              },
              {
                answer: 4,
                num_responses: 15,
                percentage: 30,
                total: 50,
                type: 'org_wide',
              },
            ],
            label: 'Super Org',
            total: 50,
            type: 'org_wide',
          },
        ],
      })
    })
  })

  describe('fetchQuestionItem()', () => {
    it('fetches the question item', () => {
      expect(apiStore.fetch).toHaveBeenCalledWith('items', 3)
    })
  })
})
