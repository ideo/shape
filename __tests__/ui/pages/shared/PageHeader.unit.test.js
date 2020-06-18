import PageHeader from '~/ui/pages/shared/PageHeader'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeTextItem, fakeCollection, fakeCollectionCard } from '#/mocks/data'
import Tooltip from '~/ui/global/Tooltip'

describe('PageHeader', () => {
  let wrapper, component, props

  beforeEach(() => {
    const uiStore = fakeUiStore
    const apiStore = fakeApiStore()
    apiStore.selectedCards = [fakeCollectionCard]
    const routingStore = fakeRoutingStore
    fakeCollection.isNormalCollection = true
    props = {
      record: { ...fakeCollection },
      isHomepage: false,
      uiStore,
      apiStore,
      routingStore,
    }

    wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('render', () => {
    describe('on the homepage', () => {
      beforeEach(() => {
        props.isHomepage = true
        wrapper.setProps(props)
      })

      it('should render an EditableName with the record.name', () => {
        expect(wrapper.find('EditableName').props().name).toEqual(
          props.record.name
        )
      })
    })

    describe('for an editable item', () => {
      beforeEach(() => {
        fakeTextItem.can_edit = true
        props.record = fakeTextItem
        wrapper.setProps(props)
      })
    })

    describe('for a private item', () => {
      beforeEach(() => {
        fakeTextItem.can_edit = true
        fakeTextItem.is_private = true
        props.record = fakeTextItem
        wrapper.setProps(props)
      })

      it('should render the HiddenIconButton', () => {
        expect(wrapper.find('HiddenIconButton').exists()).toBeTruthy()
      })
    })

    describe('for a publicly joinable collection', () => {
      beforeEach(() => {
        props.record = fakeCollection
        props.record.isPublicJoinable = true
        wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
      })
      it('should render the JoinCollectionButton', () => {
        expect(wrapper.find('Button').html()).toContain('Join')
      })
    })

    describe('for a normal collection', () => {
      it('passes canEdit through to EditableName', () => {
        expect(wrapper.find('EditableName').props().canEdit).toEqual(
          props.record.can_edit
        )
      })
    })

    describe('for a user collection', () => {
      beforeEach(() => {
        props.record.isNormalCollection = false
        props.record.isUserCollection = true
        wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
      })

      it('should not render roles', () => {
        expect(wrapper.find('RolesSummary').exists()).toBeFalsy()
      })

      it('should not render the card menu', () => {
        expect(wrapper.find('ActionMenu').exists()).toBeFalsy()
      })
    })
  })

  describe('updateRecordName', () => {
    beforeEach(() => {
      component.updateRecordName('hello')
    })

    it('should call API_updateNameAndCover on the record', () => {
      expect(props.record.API_updateNameAndCover).toHaveBeenCalled()
    })
  })

  describe('with a MasterTemplate collection', () => {
    beforeEach(() => {
      props.record = fakeCollection
      props.record.isMasterTemplate = true
      props.record.isUsableTemplate = true
      props.record.inherited_tag_list = ['template']
      wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
    })

    it('should show the template tag and icon', () => {
      expect(
        wrapper
          .find('SubduedHeading1')
          .children()
          .text()
      ).toEqual('#template')
    })

    it('should show the Use Template button', () => {
      expect(
        wrapper
          .find('Button')
          .children()
          .first()
          .text()
      ).toEqual('Use Template')
    })
  })

  describe('with a template instance collection', () => {
    beforeEach(() => {
      props.record = fakeCollection
      props.record.isUsableTemplate = false
      props.record.isMasterTemplate = false
      props.record.isTestCollection = false
      props.record.isTemplated = true
      props.template = fakeCollection
      wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
    })

    it('should show the template instance icon', () => {
      expect(wrapper.find('CollectionTypeIcon').exists()).toBeTruthy()
    })

    it('should show a clamped collection name with a TruncatableText', () => {
      expect(wrapper.find('TruncatableText').exists()).toBeTruthy()
    })

    it('should show master template navigate back button with a Tooltip', () => {
      expect(wrapper.find('BackIcon').exists()).toBeTruthy()
      expect(
        wrapper
          .find(Tooltip)
          .last()
          .props().title
      ).toMatch('go to master template')
    })

    describe('when the instance has no access to the master template', () => {
      beforeEach(() => {
        props.template.can_view = false
        props.template.anyone_can_view = false
        wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
      })

      it('should not show master template navigate back button', () => {
        expect(wrapper.find('BackIcon').exists()).toBeFalsy()
      })
    })
  })

  describe('with template whose a child of a master template', () => {
    beforeEach(() => {
      props.record = fakeCollection
      props.record.isMasterTemplate = false
      props.record.isUsableTemplate = false
      wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
    })

    it('should not show the template icon', () => {
      expect(wrapper.find('TemplateIcon').exists()).toBeFalsy()
    })
  })

  describe('with a TestCollection', () => {
    beforeEach(() => {
      props.record = fakeCollection
      props.record.launchableTestId = 99
      props.record.isUsableTemplate = false
      props.record.inherited_tag_list = ['test']
      wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
    })
  })

  describe('with an archived collection', () => {
    beforeEach(() => {
      props.record = fakeCollection
      props.record.archived = true
      props.record.is_restorable = true
      props.record.can_edit = true
      props.record.isTemplated = false
      wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
    })

    it('should render the restore button', () => {
      expect(
        wrapper
          .find('Button')
          .children()
          .first()
          .text()
      ).toEqual('Restore')
    })
  })

  describe('rightIcon', () => {
    describe('when collection is a board', () => {
      it('returns an icon', () => {
        props.record.type = 'Collection::Board'
        expect(component.rightIcon).toEqual(null)
      })
    })
  })

  describe('leftIcon', () => {
    describe('when collection is a board', () => {
      it('returns an icon', () => {
        props.record.type = 'Collection::Board'
        expect(component.leftIcon).toEqual(null)
      })
    })
  })
})
