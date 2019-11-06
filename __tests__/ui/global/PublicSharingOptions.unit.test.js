import { observable } from 'mobx'
import PublicSharingOptions from '~/ui/global/PublicSharingOptions'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeCollection, fakeGroup } from '#/mocks/data'

const apiStore = observable({
  fetch: jest.fn().mockReturnValue(Promise.resolve({ data: fakeGroup })),
  uiStore: fakeUiStore,
})

let props, wrapper, rerender, rerenderAndShowSharingOptions

describe('PublicSharingOptions', () => {
  beforeEach(() => {
    const record = {
      ...fakeCollection,
    }
    props = {
      record,
      apiStore,
      reloadGroups: jest.fn(),
      canEdit: true,
    }
    rerender = () => {
      wrapper = shallow(<PublicSharingOptions.wrappedComponent {...props} />)
    }
    rerenderAndShowSharingOptions = () => {
      rerender()
      wrapper.instance().setState({ sharingOptionsVisible: true })
      // Update so async op completes
      wrapper.update()
    }
    rerender()
  })

  it('it shows public sharing options', () => {
    expect(
      wrapper.find('[data-cy="public-sharing-options-title"]').exists()
    ).toEqual(true)
  })

  describe('not an editor', () => {
    beforeEach(() => {
      props.canEdit = false
      rerender()
    })

    it('if not editor, does not show public sharing options', () => {
      expect(props.canEdit).toEqual(false)
      expect(
        wrapper.find('[data-cy="public-sharing-options-title"]').exists()
      ).toEqual(false)
    })
  })

  describe('handleAnyoneCanViewToggle when anyone_can_view is false', () => {
    beforeEach(() => {
      props.record.anyone_can_view = false
      props.apiStore.uiStore.confirm.mockClear()
      rerenderAndShowSharingOptions()
    })

    it('defaults to show no one can view', () => {
      expect(
        wrapper
          .find('[data-cy="anyone-can-view-checkbox"]')
          .first()
          .props().control.props.checked
      ).toEqual(false)
    })

    it('toggles anyone_can_view', () => {
      wrapper.instance().handleAnyoneCanViewToggle()

      expect(props.apiStore.uiStore.confirm).toHaveBeenCalledWith({
        prompt:
          'This content and any nested collections will be available to anyone with this link. Are you sure you want to share this content?',
        iconName: 'Alert',
        confirmText: 'Continue',
        onConfirm: expect.any(Function),
      })
    })
  })

  describe('handleAnyoneCanViewToggle when anyone_can_view is true', () => {
    beforeEach(() => {
      props.record.anyone_can_view = true
      props.apiStore.uiStore.confirm.mockClear()
      rerenderAndShowSharingOptions()
    })

    it('has checked checkbox', () => {
      expect(
        wrapper
          .find('[data-cy="anyone-can-view-checkbox"]')
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

  describe('handleAnyoneCanJoinToggle when anyone_can_join is false', () => {
    beforeEach(() => {
      props.record.anyone_can_join = false
      rerenderAndShowSharingOptions()
    })

    it('has unchecked checkbox', () => {
      expect(
        wrapper
          .find('[data-cy="anyone-can-join-checkbox"]')
          .first()
          .props().control.props.checked
      ).toEqual(false)
    })

    it('updates collection if toggled', () => {
      wrapper.instance().handleAnyoneCanJoinToggle()
      expect(props.record.save).toHaveBeenCalled()
    })
  })

  describe('handleAnyoneCanJoinToggle when anyone_can_join is true', () => {
    beforeEach(() => {
      props.record.anyone_can_join = true
      props.record.joinable_group_id = '1'
      rerenderAndShowSharingOptions()
    })

    it('has checked checkbox', () => {
      expect(
        wrapper
          .find('[data-cy="anyone-can-join-checkbox"]')
          .first()
          .props().control.props.checked
      ).toEqual(true)
    })

    it('shows joinable group loaded from API', () => {
      expect(apiStore.fetch).toHaveBeenCalledWith(
        'groups',
        props.record.joinable_group_id
      )
      // Update so async op completes
      wrapper.update()
      expect(
        wrapper
          .find('EntityAvatarAndName')
          .first()
          .props().entity
      ).toEqual(fakeGroup)
    })
  })
})
