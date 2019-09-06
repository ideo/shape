import PageHeader from '~/ui/pages/shared/PageHeader'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeTextItem, fakeCollection } from '#/mocks/data'

describe('PageHeader', () => {
  let wrapper, component, props

  beforeEach(() => {
    const uiStore = fakeUiStore
    const routingStore = fakeRoutingStore
    fakeCollection.isNormalCollection = true
    fakeCollection.breadcrumb = [{ id: 12 }]
    props = {
      record: { ...fakeCollection },
      isHomepage: false,
      uiStore,
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

    it('should call API_updateName on the record', () => {
      expect(props.record.API_updateName).toHaveBeenCalled()
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
      expect(wrapper.find('TemplateIcon').exists()).toBeTruthy()
    })

    it('should show the Use Template button', () => {
      expect(
        wrapper
          .find('FormButton')
          .children()
          .first()
          .text()
      ).toEqual('Use Template')
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

    it('should show the template tag and icon', () => {
      expect(
        wrapper
          .find('SubduedHeading1')
          .children()
          .text()
      ).toEqual('#test')
      expect(wrapper.find('TestCollectionIcon').exists()).toBeTruthy()
    })
  })

  describe('with an archived collection', () => {
    beforeEach(() => {
      props.record = fakeCollection
      props.record.archived = true
      props.record.is_restorable = true
      props.record.can_edit = true
      wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
    })

    it('should render the restore button', () => {
      expect(
        wrapper
          .find('FormButton')
          .children()
          .first()
          .text()
      ).toEqual('Restore')
    })
  })
})
