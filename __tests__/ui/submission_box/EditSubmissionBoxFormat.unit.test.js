import EditSubmissionBoxFormat from '~/ui/submission_box/EditSubmissionBoxFormat'
import { submissionItemTypes } from '~/ui/submission_box/SubmissionBoxSettings'

import { fakeCollection } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

jest.mock('../../../app/javascript/stores')

let props, wrapper, rerender, uiStore, apiStore
describe('EditSubmissionBoxFormat', () => {
  beforeEach(() => {
    uiStore = fakeUiStore
    apiStore = fakeApiStore()
    props = {
      collection: {
        submission_template_id: 1234,
        ...fakeCollection,
      },
      uiStore,
      apiStore,
    }
    rerender = () => {
      wrapper = shallow(<EditSubmissionBoxFormat.wrappedComponent {...props} />)
    }
    rerender()
  })

  it('renders SubmissionBoxRowForItem for all item types', () => {
    expect(wrapper.find('SubmissionBoxRowForItem').length).toEqual(
      submissionItemTypes.length
    )
  })

  describe('if item type is chosen', () => {
    beforeEach(() => {
      props.collection.submission_box_type = 'text'
      props.collection.submissionFormat = 'item'
      props.collection.submission_template_id = null
      rerender()
    })

    it('does not render that type as an option', () => {
      const itemRows = wrapper.find('SubmissionBoxRowForItem')
      expect(itemRows.length).toEqual(2)
      const notTextType = submissionItemTypes.filter(
        type => type.name !== 'text'
      )
      expect(itemRows.at(0).props().type.name).toEqual(notTextType[0].name)
      expect(itemRows.at(1).props().type.name).toEqual(notTextType[1].name)
    })
  })

  // TODO: figure out how to mock the template loading
  //
  // describe('with template loading mocked', () => {
  //   let instance
  //   beforeEach(() => {
  //     instance = wrapper.instance()
  //   })
  //
  //   it('renders SubmissionBoxRowForTemplate for all templates', () => {
  //     instance.onSearch(
  //       observable.array([fakeCollection, fakeCollection, fakeCollection])
  //     )
  //     expect(wrapper.find('SubmissionBoxRowForTemplate').length).toEqual(3)
  //   })
  // })
})
