import SubmissionBoxSettingsModal from '~/ui/submission_box/SubmissionBoxSettingsModal'

import { fakeCollection } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'

let props, wrapper, rerender, apiStore, closeModal
describe('SubmissionBoxSettingsModal', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    props = {
      collection: {
        ...fakeCollection,
        apiStore,
        uiStore: apiStore.uiStore,
      },
    }
    rerender = () => {
      wrapper = shallow(<SubmissionBoxSettingsModal {...props} />)
    }
    closeModal = () => {
      wrapper
        .find('Modal')
        .props()
        .onClose()
    }
    rerender()
  })

  it('renders SubmissionBoxSettings with collection', () => {
    expect(wrapper.find('SubmissionBoxSettings').props().collection).toEqual(
      props.collection
    )
  })

  describe('no submission format', () => {
    beforeEach(() => {
      props.collection.submissionFormat = null
      apiStore.uiStore.confirm.mockReset()
      rerender()
    })

    it('confirms if user does not choose format', () => {
      closeModal()
      expect(apiStore.uiStore.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt:
            'Closing the submission settings without choosing a submission format will delete this submission box.',
        })
      )
    })
  })

  describe('user chose format', () => {
    beforeEach(() => {
      props.collection.submissionFormat = 'item'
      apiStore.uiStore.confirm.mockReset()
      rerender()
    })

    it('does not confirm', () => {
      closeModal()
      expect(apiStore.uiStore.confirm).not.toHaveBeenCalled()
    })

    it('closes dialog', () => {
      closeModal()
      expect(apiStore.uiStore.closeDialog).toHaveBeenCalled()
    })
  })
})
