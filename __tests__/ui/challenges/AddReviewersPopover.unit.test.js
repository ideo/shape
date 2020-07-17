import { createRef } from 'react'
import AddReviewersPopover from '~/ui/challenges/AddReviewersPopover'
import { fakeCollection } from '#/mocks/data'
import { Checkbox } from '~/ui/global/styled/forms'
import InlineModal from '~/ui/global/modals/InlineModal'

const collection = fakeCollection
const fakeEv = {
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  persist: jest.fn(),
}
let wrapper, component, props, render, potentialReviewers

describe('AddReviewersPopover', () => {
  beforeEach(() => {
    potentialReviewers = [
      { handle: 'mrpepper', name: 'Pepper', pic_url_square: 'pep.jpg' },
      { handle: 'mralfred', name: 'Alfred', pic_url_square: 'al.jpg' },
    ]
    props = {
      record: collection,
      onClose: jest.fn(),
      open: true,
      potentialReviewers,
      wrapperRef: createRef(),
    }
    render = () => {
      wrapper = shallow(<AddReviewersPopover {...props} />)
      component = wrapper.instance()
    }
    render()
  })

  describe('on reviewer click', () => {
    let checkbox

    beforeEach(() => {
      props.record.currentReviewerHandles = []
      checkbox = wrapper.find('[data-cy="ReviewerCheckbox"]').first()
      checkbox.simulate('click', fakeEv)
    })

    it('should stop the event', () => {
      expect(fakeEv.preventDefault).toHaveBeenCalled()
      expect(fakeEv.stopPropagation).toHaveBeenCalled()
    })

    describe('when reviewer is not selected', () => {
      beforeEach(() => {
        props.record.currentReviewerHandles = ['moon']
        checkbox.simulate('click', fakeEv)
      })

      it('should call removeTag on the collection', () => {
        expect(collection.addTag).toHaveBeenCalled()
        expect(collection.addTag).toHaveBeenCalledWith(
          'mrpepper',
          'user_tag_list',
          props.potentialReviewers[0]
        )
      })
    })

    describe('when reviewer is selected', () => {
      let oldMethod

      beforeEach(() => {
        props.record.currentReviewerHandles = ['mrprepper']
        oldMethod = component.isReviewerSelected
        component.isReviewerSelected = jest.fn().mockReturnValue(true)
        checkbox.simulate('click', fakeEv)
      })

      afterEach(() => {
        component.isReviewerSelected = oldMethod
      })

      it('should call removeTag on the collection', () => {
        expect(collection.removeTag).toHaveBeenCalled()
      })
    })
  })

  describe('isReviewerSelected()', () => {
    describe('with no current reviewers', () => {
      beforeEach(() => {
        props.record.currentReviewerHandles = []
      })

      it('should return false', () => {
        expect(component.isReviewerSelected({ handle: '1' })).toBe(false)
      })
    })

    describe('when the potential reviewer is a reviewer', () => {
      const reviewerHandle = 'mo'

      beforeEach(() => {
        props.record.currentReviewerHandles = [reviewerHandle]
      })

      it('should return true', () => {
        expect(component.isReviewerSelected({ handle: reviewerHandle })).toBe(
          true
        )
      })
    })

    describe('when the potential reviewer is not a reviewer', () => {
      beforeEach(() => {
        props.record.currentReviewerHandles = ['fig', 'alfred', 'pepper']
      })

      it('should return false', () => {
        expect(component.isReviewerSelected({ handle: 'sardine' })).toBe(false)
      })
    })
  })

  describe('render()', () => {
    it('should pass the open prop to InlineModal', () => {
      const modal = wrapper.find(InlineModal)
      expect(modal.props().open).toBe(true)
    })

    it('should create a checkbox for each potential reviewer', () => {
      expect(wrapper.find(Checkbox).length).toEqual(2)
    })
  })
})
