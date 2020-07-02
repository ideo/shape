import PageHeader from '~/ui/pages/shared/PageHeader'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeTextItem, fakeCollection, fakeCollectionCard } from '#/mocks/data'
import Tooltip from '~/ui/global/Tooltip'

describe('PageHeader', () => {
  let wrapper, component, props, rerender

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

    rerender = () => {
      wrapper = shallow(<PageHeader.wrappedComponent {...props} />)
      component = wrapper.instance()
    }

    rerender()
  })

  describe('render', () => {
    describe('on the homepage', () => {
      beforeEach(() => {
        props.isHomepage = true
        rerender()
      })

      it('should render an EditableName with the record.name', () => {
        expect(wrapper.find('EditableName').props().name).toContain(
          props.record.name
        )
      })
    })

    describe('for an editable item', () => {
      beforeEach(() => {
        const textItem = fakeTextItem
        textItem.can_edit = true
        props.record = textItem
        rerender()
      })
    })

    describe('for a private item', () => {
      beforeEach(() => {
        const privateItem = fakeTextItem
        privateItem.can_edit = true
        privateItem.is_private = true
        props.record = privateItem
        rerender()
      })

      it('should render the HiddenIconButton', () => {
        expect(wrapper.find('HiddenIconButton').exists()).toBeTruthy()
      })
    })

    describe('for a publicly joinable collection', () => {
      beforeEach(() => {
        const joinableCollection = fakeCollection
        joinableCollection.isPublicJoinable = true
        props.record = joinableCollection
        rerender()
      })
      it('should render the JoinCollectionButton', () => {
        expect(wrapper.find('Button').text()).toContain('Join')
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
        const userCollection = fakeCollection
        userCollection.isNormalCollection = false
        userCollection.isUserCollection = true
        props.record = userCollection
        rerender()
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
      const masterTemplate = fakeCollection
      masterTemplate.isMasterTemplate = true
      masterTemplate.isUsableTemplate = true
      masterTemplate.inherited_tag_list = ['template']
      props.record = masterTemplate
      rerender()
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
      const instanceCollection = fakeCollection
      instanceCollection.isUsableTemplate = false
      instanceCollection.isMasterTemplate = false
      instanceCollection.isTestCollection = false
      instanceCollection.isTemplated = true
      props.template = fakeCollection
      props.record = instanceCollection
      rerender()
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
        const template = fakeCollection
        template.can_view = false
        template.anyone_can_view = false
        props.template = template
        rerender()
      })

      it('should not show master template navigate back button', () => {
        expect(wrapper.find('BackIcon').exists()).toBeFalsy()
      })
    })
  })

  describe('with template whose a child of a master template', () => {
    beforeEach(() => {
      const masterTemplate = fakeCollection
      masterTemplate.isMasterTemplate = false
      masterTemplate.isUsableTemplate = false
      props.record = masterTemplate
      rerender()
    })

    it('should not show the template icon', () => {
      expect(wrapper.find('TemplateIcon').exists()).toBeFalsy()
    })
  })

  describe('with a TestCollection', () => {
    beforeEach(() => {
      const collectionWithlaunchableTest = fakeCollection
      collectionWithlaunchableTest.launchableTestId = 99
      collectionWithlaunchableTest.isUsableTemplate = false
      collectionWithlaunchableTest.inherited_tag_list = ['test']
      props.record = collectionWithlaunchableTest
      rerender()
    })
  })

  describe('with an archived collection', () => {
    beforeEach(() => {
      const archivedCollection = fakeCollection
      archivedCollection.archived = true
      archivedCollection.is_restorable = true
      archivedCollection.can_edit = true
      props.record = archivedCollection
      rerender()
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

  describe('left and right icons', () => {
    describe('when collection is a board', () => {
      beforeEach(() => {
        const boardCollection = fakeCollection
        boardCollection.type = 'Collection::Board'
        props.record = boardCollection
        rerender()
      })
      it('returns a rightIcon', () => {
        expect(component.rightIcon).toEqual(null)
      })
      it('returns an leftIcon', () => {
        expect(component.leftIcon).toEqual(null)
      })
    })
  })

  describe('with a challenge collection type', () => {
    beforeEach(() => {
      const challengeCollection = fakeCollection
      challengeCollection.isChallengeOrInsideChallenge = true
      challengeCollection.collection_type = 'challenge'
      props.record = challengeCollection
      rerender()
    })

    it('renders the ChallengeSubHeader', () => {
      expect(wrapper.find('ChallengeSubHeader').exists()).toBe(false)
    })

    it('renders the ChallengeHeaderButton', () => {
      expect(wrapper.find('ChallengeHeaderButton').exists()).toBe(true)
    })
  })

  describe('with a submission box collection', () => {
    beforeEach(() => {
      const submissionsBoxCollection = fakeCollection
      submissionsBoxCollection.isSubmissionBox = true
      submissionsBoxCollection.isChallengeOrInsideChallenge = true
      submissionsBoxCollection.submissions_collection = fakeCollection
      props.record = submissionsBoxCollection
      rerender()
    })

    it('should render the ChallengeSubHeader', () => {
      expect(wrapper.find('ChallengeSubHeader').exists()).toBe(false)
    })

    it('should render the Button', () => {
      expect(wrapper.find('Button').exists()).toBe(true)
    })

    it('should render the button with no reviewable submissions', () => {
      expect(
        wrapper
          .find('Button')
          .children()
          .last()
          .text()
      ).toContain('No Reviewable Submissions')
    })

    describe('with reviewable submissions', () => {
      beforeEach(() => {
        const submissionsBoxCollection = fakeCollection
        submissionsBoxCollection.isSubmissionBox = true
        submissionsBoxCollection.isChallengeOrInsideChallenge = true
        const submissionsCollection = fakeCollection
        submissionsCollection.reviewableCards = [fakeCollectionCard]
        submissionsBoxCollection.submissions_collection = submissionsCollection
        props.record = submissionsBoxCollection
        rerender()
      })
      it('should render the button with reviewable submissions', () => {
        expect(
          wrapper
            .find('Button')
            .children()
            .last()
            .text()
        ).toContain('Review Submissions')
      })
    })
  })

  describe('with a phase collection type inside a challenge', () => {
    beforeEach(() => {
      const phaseCollection = fakeCollection
      phaseCollection.isInsideAChallenge = true
      phaseCollection.challenge = fakeCollection
      phaseCollection.collection_type = 'phase'
      props.record = phaseCollection
      rerender()
    })

    it('should render the ChallengeSubHeader', () => {
      expect(wrapper.find('ChallengeSubHeader').exists()).toBe(true)
    })
  })
})
