import AddSubmission from '~/ui/grid/blankContentTool/AddSubmission'
import Collection from '~/stores/jsonApi/Collection'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

jest.mock('../../../../app/javascript/stores/index')
jest.mock('../../../../app/javascript/stores/jsonApi/Collection')

let props, wrapper
const fakeEv = { preventDefault: jest.fn() }

describe('GridCardBlank', () => {
  beforeEach(() => {
    fakeUiStore.viewingCollection = fakeCollection
    fakeUiStore.viewingCollection.submissionTypeName = 'text'
    props = {
      uiStore: fakeUiStore,
      parent_id: fakeCollectionCard.parent_id,
      submissionSettings: {
        type: 'text',
        template: fakeCollection,
      },
    }
    wrapper = shallow(<AddSubmission.wrappedComponent {...props} />)
  })

  describe('render()', () => {
    it('should say the submission type name', () => {
      expect(wrapper.find('StyledBlankCreationTool h3').text()).toEqual(
        'Add a new text'
      )
    })

    it('should render a submission button', () => {
      expect(wrapper.find('SubmissionButton').exists()).toBe(true)
    })
  })

  describe('handleSubmission()', () => {
    beforeEach(() => {
      wrapper.find('SubmissionButton').simulate('click', fakeEv)
    })

    it('should create submission on the collection record', () => {
      expect(Collection.createSubmission).toHaveBeenCalled()
      expect(Collection.createSubmission).toHaveBeenCalledWith(
        props.parent_id,
        props.submissionSettings
      )
    })
  })
})
