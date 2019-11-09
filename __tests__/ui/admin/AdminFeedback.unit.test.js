import axios from 'axios'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import AdminFeedback from '~/ui/admin/AdminFeedback'
import {
  fakeTestCollection,
  fakeAudience,
  fakeTestAudience,
} from '#/mocks/data'

// mock the result of the API call w/ axios
jest.mock('axios')
axios.get.mockReturnValue(Promise.resolve({ data: { months: ['June 2019'] } }))

const waitForAsync = () => new Promise(resolve => setImmediate(resolve))

describe('AdminFeedback', () => {
  let wrapper
  describe('with multiple pages of results', () => {
    beforeEach(async () => {
      const props = {
        apiStore: fakeApiStore({
          requestResult: {
            data: [fakeTestCollection],
            totalPages: 2,
          },
        }),
        uiStore: fakeUiStore,
      }

      wrapper = shallow(<AdminFeedback.wrappedComponent {...props} />)
      await waitForAsync()
      wrapper.update()
    })

    it('shows the list of tests', () => {
      expect(wrapper.find('FeedbackRow').length).toEqual(1)
    })

    // TODO: redo this using data selectors
    // doing it by index is brittle, re: UI changes
    it('shows audience data for each test', () => {
      const audienceRowItems = wrapper.find('AudienceRowItem')
      expect(audienceRowItems.length).toEqual(5)

      const audienceName = audienceRowItems.at(0)
      expect(audienceName.html()).toContain(fakeAudience.name)

      const audiencePricePerResponse = audienceRowItems.at(1)
      expect(audiencePricePerResponse.html()).toContain('$3.75')

      const audienceSampleSize = audienceRowItems.at(2)
      expect(audienceSampleSize.html()).toContain(fakeTestAudience.sample_size)

      // TODO: wire up "Sourced from INA" column to real data
      const inaSourcedCount = audienceRowItems.at(3)
      expect(inaSourcedCount.html()).toContain(0)

      const audienceResponseCount = audienceRowItems.at(4)
      expect(audienceResponseCount.html()).toContain(
        fakeTestAudience.num_completed_responses
      )
    })

    describe('pagination', () => {
      it('shows current page and total pages', () => {
        const pagination = wrapper.find('PaginationWrapper')
        expect(pagination.exists()).toBeTruthy()
        expect(pagination.html()).toContain('1/2')
      })

      it('loads previous and next pages of tests', async () => {
        let previousPageButton = wrapper.find('PaginationButton')
        expect(previousPageButton.props().disabled).toBeTruthy()

        let nextPageButton = wrapper.find('NextPageButton')
        nextPageButton.simulate('click')

        await waitForAsync()
        wrapper.update()

        let pagination = wrapper.find('PaginationWrapper')
        expect(pagination.html()).toContain('2/2')

        nextPageButton = wrapper.find('NextPageButton')
        expect(nextPageButton.props().disabled).toBeTruthy()

        previousPageButton = wrapper.find('PaginationButton')
        previousPageButton.simulate('click')

        await waitForAsync()
        wrapper.update()

        pagination = wrapper.find('PaginationWrapper')
        expect(pagination.html()).toContain('1/2')
      })
    })
  })

  describe('with single page of results', () => {
    beforeEach(async () => {
      const props = {
        apiStore: fakeApiStore({
          requestResult: {
            data: [fakeTestCollection],
            totalPages: 1,
          },
        }),
        uiStore: fakeUiStore,
      }

      wrapper = shallow(<AdminFeedback.wrappedComponent {...props} />)
      await waitForAsync()
      wrapper.update()
    })

    it('does not show the pagination controls', () => {
      expect(wrapper.find('PaginationWrapper').exists()).toBeFalsy()
    })
  })
})
