import ChallengeListCard, {
  transformColumnsForChallenge,
} from '~/ui/challenges/ChallengeListCard'
import ListCard from '~/ui/grid/ListCard'

import AddReviewersPopover from '~/ui/challenges/AddReviewersPopover'
import AvatarList from '~/ui/users/AvatarList'
import { defaultColumns } from '~/ui/grid/CollectionList'

import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/clickUtils')

const card = fakeCollectionCard
let wrapper, props, render, record
const fakeRef = {}
describe('ListCard', () => {
  beforeEach(() => {
    record = { ...fakeCollection, taggedUsersWithStatuses: [] }
    props = {
      card,
      submissionsCollection: { ...fakeCollection, potentialReviewers: [] },
      columns: transformColumnsForChallenge(defaultColumns()),
      record,
      apiStore: fakeApiStore(),
    }
    render = () => {
      wrapper = shallow(<ChallengeListCard.wrappedComponent {...props} />)
    }
    render()
  })

  describe('render()', () => {
    describe('when a card is inside a challenge', () => {
      beforeEach(() => {
        props.insideChallenge = true
        record.internalType = 'collections'
        render()
      })

      it('should render AvatarList and AddReviewersPopover', () => {
        const listCard = wrapper.find(ListCard)
        const Column3Override = listCard.props().columns[3].overrideContent
        const column3Wrapper = shallow(Column3Override(fakeRef))
        expect(column3Wrapper.find(AvatarList).exists()).toBe(true)
        expect(column3Wrapper.find(AddReviewersPopover).exists()).toBe(true)
      })

      it('by default, should not render column 4 with ChallengeReviewButton', () => {
        const listCard = wrapper.find(ListCard)
        const Column4Override = listCard.props().columns[4].overrideContent
        expect(Column4Override).toBe(undefined)
      })

      describe('when isCurrentUserAReviewer', () => {
        beforeEach(() => {
          props.record.isCurrentUserAReviewer = true
          props.record.submission_reviewer_status = 'in_progress'
          render()
        })

        it('should render ChallengeReviewButton', () => {
          const listCard = wrapper.find(ListCard)
          const Column4Override = listCard.props().columns[4].overrideContent
          const column4Wrapper = shallow(Column4Override())
          expect(column4Wrapper.find('Button').text()).toEqual('Review')
        })
      })
    })
  })
})
