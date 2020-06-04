require 'rails_helper'
require_relative 'shared_setup'

RSpec.describe CollectionCardFilter::ForUser, type: :service do
  describe '#call' do
    include_context 'CollectionCardFilter setup'

    let(:cards_scope) { CollectionCard.where(id: visible_cards.pluck(:id)) }
    subject do
      CollectionCardFilter::ForUser.call(
        cards_scope: cards_scope,
        user: user,
      )
    end

    context 'as a viewer without access to private_card' do
      let!(:user) { viewer }

      it 'returns visible cards other than private_card' do
        expect(subject).to match_array(
          visible_cards - [private_card],
        )
      end
    end

    context 'as a super admin' do
      let!(:user) { super_admin }

      it 'returns all public or private, non-hidden cards' do
        expect(subject).to match_array(
          visible_cards,
        )
      end
    end

    context 'with groups' do
      let(:user) { create(:user, current_organization: organization) }
      let!(:child_group) { create(:group, organization: organization) }
      let!(:group) { create(:group, organization: organization, add_subgroups: [child_group]) }
      before do
        group.add_role(Role::VIEWER, private_card.record)
      end

      it 'returns no visible cards when user is not a viewer or member of any group' do
        expect(collection.can_view?(user)).to be false
        expect(subject).to match_array([])
      end

      context 'when user is a(ny) member of a group that is a subgroup of another group' do
        let!(:child_group) { create(:group, organization: organization, add_members: [user]) }

        it 'returns all cards that the farthest away ancestor group can view' do
          expect(collection.can_view?(user)).to be true
          expect(subject).to match_array(visible_cards)
        end
      end
    end
  end
end
