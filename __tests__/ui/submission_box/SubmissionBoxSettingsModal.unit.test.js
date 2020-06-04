import SubmissionBoxSettingsModal from '~/ui/submission_box/SubmissionBoxSettingsModal'

import { fakeCollection } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'

jest.mock('../../../app/javascript/stores')

let props, wrapper, rerender, uiStore, closeModal
describe('SubmissionBoxSettingsModal', () => {
  beforeEach(() => {
    uiStore = fakeUiStore
    props = {
      collection: fakeCollection,
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
      uiStore.confirm.mockReset()
      rerender()
    })

    it('confirms if user does not choose format', () => {
      closeModal()
      expect(uiStore.confirm).toHaveBeenCalledWith(
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
      uiStore.confirm.mockReset()
      rerender()
    })

    it('does not confirm', () => {
      closeModal()
      expect(uiStore.confirm).not.toHaveBeenCalled()
    })

    it('closes dialog', () => {
      closeModal()
      expect(uiStore.closeDialog).toHaveBeenCalled()
    })
  })
})
