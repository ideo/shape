import { observable } from 'mobx'
import PublicSharingOptions from '~/ui/global/PublicSharingOptions'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeCollection } from '#/mocks/data'

const apiStore = observable({
  uiStore: fakeUiStore,
})

let props, wrapper

describe('PublicSharingOptions', () => {
  beforeEach(() => {
    const record = {
      ...fakeCollection,
    }
    props = {
      record,
      apiStore,
      canEdit: false,
    }
    wrapper = shallow(<PublicSharingOptions.wrappedComponent {...props} />)
  })

  it('if not editor, does not show viewable by anyone toggle', () => {
    expect(props.canEdit).toEqual(false)
    expect(
      wrapper.find('[data-cy="viewable-by-anyone-checkbox"]').exists()
    ).toEqual(false)
  })

  describe('handleViewableByAnyoneToggle when anyone_can_view is false', () => {
    beforeEach(() => {
      props.record.anyone_can_view = false
      props.apiStore.uiStore.confirm.mockClear()
      props.canEdit = true
      wrapper = shallow(<PublicSharingOptions.wrappedComponent {...props} />)
    })

    it('defaults to show no one can view', () => {
      expect(
        wrapper
          .find('[data-cy="viewable-by-anyone-checkbox"]')
          .first()
          .props().control.props.checked
      ).toEqual(false)
    })

    it('toggles anyone_can_view', () => {
      wrapper.instance().handleAnyoneCanViewToggle()

      expect(props.apiStore.uiStore.confirm).toHaveBeenCalledWith({
        prompt:
          'This content will be available to anyone with this link. Are you sure you want to share this content?',
        iconName: 'Alert',
        confirmText: 'Continue',
        onConfirm: expect.any(Function),
      })
    })
  })

  describe('handleViewableByAnyoneToggle when anyone_can_view is true', () => {
    beforeEach(() => {
      props.record.anyone_can_view = true
      props.apiStore.uiStore.confirm.mockClear()
      props.canEdit = true
      wrapper = shallow(<PublicSharingOptions.wrappedComponent {...props} />)
    })

    it('has checked checkbox', () => {
      expect(
        wrapper
          .find('[data-cy="viewable-by-anyone-checkbox"]')
          .first()
          .props().control.props.checked
      ).toEqual(true)
    })

    it('toggles anyone_can_view without confirmation', () => {
      wrapper.instance().handleAnyoneCanViewToggle()
      expect(props.apiStore.uiStore.confirm).not.toHaveBeenCalled()
      expect(props.record.save).toHaveBeenCalled()
    })

    it('enables clicking to copy link', () => {
      wrapper.find('PublicViewLink').simulate('click')
      expect(props.apiStore.uiStore.popupSnackbar).toHaveBeenCalledWith({
        message: 'Link Copied',
      })
    })
  })
})
