require 'rails_helper'

describe User, type: :model do
  let!(:user) { create(:user) }

  context 'associations' do
    it { should belong_to :current_organization }
    it { should belong_to :current_user_collection }
    it { should have_many :collections }
    it { should have_many :users_roles }
    it { should have_and_belong_to_many :roles }
    it { should have_many :roles_for_groups }
    it { should have_many :roles_for_collections }
    it { should have_many :groups }
    it { should have_many :current_org_groups }
    it { should have_many :organizations }
    it { should have_many :comments }
    it { should have_many :activities_as_actor }
    it { should have_many :notifications }
    it { should have_many :survey_responses }

    context 'as application bot user' do
      let(:organizations) { create_list(:organization, 2) }
      let!(:application) { create(:application, add_orgs: organizations) }
      let(:user) { application.user }

      it 'should find organizations via the application' do
        expect(user.organizations).to match_array organizations
        expect(user.organizations).to match_array application.organizations
      end
    end
  end

  context 'validations' do
    it { should validate_presence_of(:uid) }
    it { should validate_presence_of(:provider) }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:uid).scoped_to(:provider) }
  end

  context 'callbacks' do
    let!(:org) { create(:organization) }
    let(:org_group) { org.guest_group }
    let!(:org_2) { create(:organization) }
    let(:org_2_group) { org_2.guest_group }

    describe '#after_add_role' do
      it 'should reset cached roles and reindex user' do
        expect(user).to receive(:reset_cached_roles!)
        user.add_role(Role::MEMBER, org_group)
      end

      it 'should reindex user if added to primary group' do
        expect(user).to receive(:reindex)
        user.add_role(Role::MEMBER, org.primary_group)
      end

      context 'with a user being added to admin group' do
        before do
          user.add_role(Role::ADMIN, org.primary_group)
        end

        it 'should add the user as an admin to the primary group' do
          expect(user.has_role?(Role::ADMIN, org.admin_group)).to be true
        end
      end

      context 'with a user being added as admin to primary group' do
        before do
          user.add_role(Role::ADMIN, org.primary_group)
        end

        it 'should add the user as an admin to the admin group' do
          expect(user.has_role?(Role::ADMIN, org.admin_group)).to be true
        end
      end
    end

    context 'with user collection filters' do
      let!(:collection_filter_not_user) { create(:collection_filter, text: user.handle) }
      let!(:collection_filter) { create(:collection_filter, filter_type: :user_tag, text: user.handle) }

      describe '#update_collection_filters' do
        it 'updates any collection filters with new handle' do
          old_handle = user.handle
          user.update(handle: 'my-new-fancy-handle')
          expect(collection_filter.reload.text).to eq('my-new-fancy-handle')
          expect(collection_filter_not_user.reload.text).to eq(old_handle)
        end
      end

      describe '#delete_collection_filters' do
        it 'deletes any collection filters with handle' do
          expect { user.destroy }.to change(CollectionFilter, :count).by(-1)
          expect(CollectionFilter.exists?(collection_filter.id)).to be false
        end
      end
    end

    describe '#update_profile_names' do
      let!(:profile) { create(:user_profile, created_by: user, name: 'My Profile') }

      it 'should update all UserProfiles to match user name' do
        user.reload # pick up user_profiles relation
        user.update(first_name: 'Bill', last_name: 'Hader')
        expect(profile.reload.name).to eq 'Bill Hader'
      end
    end

    describe '#update_mailing_list_subscription' do
      it 'should call the MailingListSubscriptionWorker if mailing_list value is changed' do
        expect(
          MailingListSubscriptionWorker,
        ).to receive(:perform_async).with(user.id, :products_mailing_list, true)

        user.update(mailing_list: true)

        expect(
          MailingListSubscriptionWorker,
        ).to receive(:perform_async).with(user.id, :products_mailing_list, false)
        user.update(mailing_list: false)
      end

      it 'should not call the MailingListSubscriptionWorker if mailing_list value is not changed' do
        expect(
          MailingListSubscriptionWorker,
        ).not_to receive(:perform_async).with(user.id, :products_mailing_list, user.mailing_list)
        user.update(first_name: 'Velma')
      end
    end

    describe '#update_shape_user_list_subscription' do
      before do
        allow(MailingListSubscriptionWorker).to receive(:perform_async).and_call_original
      end

      it 'calls worker to subscribe on user create' do
        user = create(:user)
        expect(
          MailingListSubscriptionWorker,
        ).to have_received(:perform_async).with(user.id, :shape_users, true)
      end

      context 'activating pending user' do
        let!(:pending_user) { create(:user, :pending) }

        it 'calls subscribe' do
          expect(
            MailingListSubscriptionWorker,
          ).not_to have_received(:perform_async).with(pending_user.id, :shape_users, true)
          pending_user.update(
            uid: SecureRandom.hex(10),
            provider: 'ideo',
            status: :active,
          )
          expect(pending_user.active?).to be true
          expect(
            MailingListSubscriptionWorker,
          ).to have_received(:perform_async).with(pending_user.id, :shape_users, true)
        end
      end

      context 'archiving active user' do
        let(:active_user) { user }

        it 'calls unsubscribe' do
          active_user.update(status: :archived)
          expect(
            MailingListSubscriptionWorker,
          ).to have_received(:perform_async).with(active_user.id, :shape_users, false)
          expect(
            MailingListSubscriptionWorker,
          ).to have_received(:perform_async).with(active_user.id, :shape_circle, false)
          expect(
            MailingListSubscriptionWorker,
          ).to have_received(:perform_async).with(active_user.id, :products_mailing_list, false)
        end
      end
    end

    context 'network user callbacks' do
      let(:network_user) { double('network_user') }

      before do
        allow(network_user).to receive(:locale)
        expect(NetworkApi::User).to receive(:find).with(user.uid).and_return([network_user])
      end

      describe '#update_profile_locale' do
        it 'should call the network to update the locale' do
          expect(NetworkUserUpdateWorker).to receive(:perform_async).with(
            user.id, :locale
          )
          user.update(locale: 'es')
        end
      end

      describe '#update_from_network_profile' do
        let(:params) do
          {
            first_name: 'Bob',
            last_name: 'Smith',
            email: 'bob@smith.com',
            picture: 'http://new.img.url',
            picture_large: 'http://new.img.url/large',
            locale: 'es',
            username: 'bob-smith',
          }
        end

        it 'should update the local params based on network attributes' do
          user.update_from_network_profile(params)
          %i[first_name last_name email picture picture_large locale].each do |field|
            expect(user.send(field)).to eq params[field]
          end
          expect(user.handle).to eq params[:username]
        end
      end
    end
  end

  describe '#add_role' do
    let(:collection) { create(:collection) }

    it 'adds role' do
      expect(user.add_role(Role::EDITOR, collection).persisted?).to be true
      expect(user.has_role?(Role::EDITOR, collection)).to be true
    end

    context 'with another user' do
      let(:user_2) { create(:user) }

      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'adds role' do
        expect(user_2.add_role(Role::EDITOR, collection).persisted?).to be true
        expect(user_2.has_role?(Role::EDITOR, collection)).to be true
      end

      it 'does not duplicate role' do
        expect do
          user_2.add_role(Role::EDITOR, collection)
        end.not_to change(collection.roles, :count)
      end
    end

    context 'with another group' do
      let!(:group) { create(:group) }

      before do
        group.add_role(Role::EDITOR, collection)
      end

      it 'adds role' do
        expect(group.has_role?(Role::EDITOR, collection)).to be true
      end

      it 'does not duplicate role' do
        expect do
          group.add_role(Role::EDITOR, collection)
        end.not_to change(Role, :count)
      end
    end
  end

  describe '.from_omniauth' do
    let(:auth) do
      Hashie::Mash.new(
        provider: 'ideo',
        uid: '123',
        info: {
          email: Faker::Internet.unique.email,
          first_name: Faker::Name.first_name,
          last_name: Faker::Name.last_name,
          image: 'http://pic.url.net',
        },
        extra: {
          raw_info: {
            picture: 'http://pic.url.net',
            picture_medium: 'http://pic.url.net/med',
            picture_large: 'http://pic.url.net/lg',
            locale: 'es',
          },
        },
      )
    end
    let(:omniauth_user) { User.from_omniauth(auth) }

    context 'with existing user' do
      let!(:existing_user) { create(:user, provider: 'ideo', uid: '123') }

      it 'updates existing user if found' do
        expect(omniauth_user.id).to eq existing_user.id
        expect(omniauth_user.email).to eq auth.info.email
        expect(omniauth_user.first_name).to eq auth.info.first_name
        expect(omniauth_user.last_name).to eq auth.info.last_name
        expect(omniauth_user.picture).to eq auth.extra.raw_info.picture
        expect(omniauth_user.picture_medium).to eq auth.extra.raw_info.picture_medium
        expect(omniauth_user.picture_large).to eq auth.extra.raw_info.picture_large
        expect(omniauth_user.locale).to eq auth.extra.raw_info.locale
      end
    end

    context 'with pending user found via email' do
      let!(:email_matching_user) { create(:user, :pending, email: auth.info.email) }

      it 'finds matching user' do
        expect(omniauth_user.id).to eq email_matching_user.id
      end
    end

    context 'without existing user' do
      it 'sets up new user record' do
        expect(omniauth_user.new_record?).to be true
      end
    end

    context 'with a limited user' do
      let(:phone) { '123123' }
      let(:auth) do
        Hashie::Mash.new(
          provider: 'ideo',
          uid: '123',
          info: {
            email: Faker::Internet.unique.email,
          },
          extra: {
            raw_info: {
              phone: phone,
              type: 'User::Limited',
              picture: 'http://pic.url.net',
              picture_medium: 'http://pic.url.net/med',
              picture_large: 'http://pic.url.net/lg',
            },
          },
        )
      end

      it 'saves the phone number' do
        expect(omniauth_user.phone).to eq phone
      end

      it 'marks the user as limited' do
        expect(omniauth_user.limited?).to be true
      end
    end
  end

  describe '#organizations' do
    let!(:organizations) { create_list(:organization, 2) }

    before do
      user.add_role(Role::MEMBER, organizations[0].primary_group)
      user.add_role(Role::ADMIN, organizations[1].primary_group)
    end

    it 'should return all organizations they have any role on' do
      expect(user.organizations).to match_array(organizations)
    end
  end

  describe '#name' do
    it 'should concatenate first and last name' do
      expect(user.name).to eq("#{user.first_name} #{user.last_name}")
    end

    it 'should not include spaces if first name is empty' do
      user.first_name = nil
      expect(user.name).to eq(user.last_name)
    end

    it 'should not include spaces if last name is empty' do
      user.last_name = nil
      expect(user.name).to eq(user.first_name)
    end
  end

  describe '#search_data' do
    let!(:user) { create(:user) }
    let(:organizations) { create_list(:organization, 2) }

    it 'should include downcased name, email, handle, organization_ids' do
      expect(user.search_data).to eq(
        name: user.name.downcase,
        email: user.email_search_tokens,
        handle: user.handle.downcase,
        status: user.status,
        organization_ids: [],
        application_bot: false,
        taggings_count: 0,
      )
    end

    context 'if user is member of orgs' do
      before do
        user.add_role(:member, organizations[0].primary_group)
        user.add_role(:member, organizations[1].primary_group)
        user.reload
      end

      it 'should have org ids' do
        expect(user.search_data[:organization_ids]).to match_array(organizations.map(&:id))
      end
    end
  end

  describe '#has_role?' do
    context 'with base role' do
      it 'is true if user has role' do
        user.add_role(:admin)
        expect(user.has_role?(:admin)).to be true
      end

      it 'is false if user does not have role' do
        expect(user.has_role?(:admin)).to be false
      end
    end

    context 'with base class object' do
      let(:object) { create(:collection) }

      it 'is true if user has role' do
        user.add_role(Role::EDITOR, object)
        expect(user.has_role?(:editor, object)).to be true
      end

      it 'is false if user does not have role' do
        expect(user.has_role?(:editor, object)).to be false
      end
    end

    context 'with STI object' do
      let(:object) { create(:text_item) }

      it 'is true if user has role' do
        user.add_role(Role::EDITOR, object)
        expect(user.has_role?(:editor, object)).to be true
      end

      it 'is fale if user does not have role' do
        expect(user.has_role?(:editor, object)).to be false
      end
    end
  end

  describe '#create_pending_user' do
    let!(:org) { create(:organization_without_groups) }
    let(:email) { Faker::Internet.email }
    let(:invitation_from_network) do
      Mashie.new(email: email, token: SecureRandom.alphanumeric(12))
    end
    let(:create_user) do
      User.create_pending_user(
        invitation: invitation_from_network,
        organization_id: org.id,
      )
    end

    it 'should create a new pending user' do
      user = create_user
      expect(user.persisted? && user.pending?).to be true
      expect(user.email).to eq(email)
    end

    it 'should create network_invitation records' do
      expect {
        create_user
      }.to change(NetworkInvitation, :count).by(1)
    end

    it 'should match network_invitation records to provided token and org' do
      user = create_user
      invitation_token = user.network_invitations.last
      expect(invitation_token.token).to eq(invitation_from_network.token)
      expect(invitation_token.organization).to eq(org)
    end

    it 'should not be case sensitive' do
      user = create_user
      user.update_attributes(email: email.upcase)
      expect(user.email).to eq(email.downcase)
    end
  end

  describe '#roles_via_current_org_groups' do
    let!(:user) { create(:user) }
    let(:organization) { create(:organization, member: user) }
    let(:group) { create(:group, organization: organization) }
    let(:collection) { create(:collection) }

    before do
      user.add_role(Role::MEMBER, group)
      group.add_role(Role::EDITOR, collection)
    end

    it 'should include all group roles' do
      role = user.role_via_current_org_groups(Role::EDITOR, collection.resource_identifier)
      expect(role).to eq(collection.roles.where(name: Role::EDITOR))
    end
  end

  context 'loading current organization groups' do
    let!(:org) { create(:organization, member: user) }
    let!(:org_2) { create(:organization) }
    let!(:group_in_org_member) do
      create(:group,
             organization: user.current_organization,
             add_members: [user])
    end
    let!(:group_in_org_not_member) do
      create(:group, organization: user.current_organization)
    end
    let!(:group_not_in_org) do
      create(:group,
             organization: org_2,
             add_members: [user])
    end

    describe '#current_org_groups' do
      it 'only returns groups this user is a member of in current org' do
        expect(user.has_role?(Role::MEMBER, group_in_org_member)).to be true
        expect(user.has_role?(Role::MEMBER, org.primary_group)).to be true
        expect(user.has_role?(Role::MEMBER, group_in_org_not_member)).to be false
        expect(user.has_role?(Role::MEMBER, group_not_in_org)).to be true
        expect(user.current_org_groups).to match_array([group_in_org_member, org.primary_group])
      end
    end

    describe '#current_org_groups_and_special_groups' do
      let(:admin) { create(:user) }
      let(:guest) { create(:user) }
      let!(:org) { create(:organization, member: user, guest: guest, admin: admin) }

      it 'does not allow guest to see their own guest group' do
        expect(guest.current_org_groups_and_special_groups).to match_array([])
      end

      it 'allows access to the guest group for org members' do
        expect(user.current_org_groups_and_special_groups).to match_array([group_in_org_member, org.primary_group, org.guest_group])
        expect(admin.current_org_groups_and_special_groups).to match_array([org.primary_group, org.guest_group, org.admin_group])
      end

      context 'with super admin role' do
        let(:common_resource) { create(:global_group, organization: org) }
        let(:super_admin) { create(:user, :super_admin, add_to_org: org) }

        it 'shows all org groups, except global groups' do
          # 3 org groups and 2 more groups created above
          expect(super_admin.current_org_groups_and_special_groups.length).to be 5
          expect(super_admin.current_org_groups_and_special_groups).not_to include(common_resource)
        end
      end
    end
  end

  describe '#switch_to_organization' do
    let(:user) { create(:user) }
    let!(:organization) { create(:organization) }
    let!(:org_user_collection) do
      # Create user collection manually
      # To make sure being in an org isn't coupled with being a group member/admin
      Collection::UserCollection.find_or_create_for_user(user, organization)
    end

    it 'sets current_organization' do
      expect(user.current_organization).to be_nil
      expect(user.switch_to_organization(organization)).to be_truthy
      expect(user.current_organization).to eq(organization)
    end

    it 'sets current_user_collection' do
      expect(user.current_user_collection).to be_nil
      expect(user.switch_to_organization(organization)).to be_truthy
      expect(user.current_user_collection).to eq(org_user_collection)
    end

    context 'with two orgs' do
      let!(:organization2) { create(:organization) }
      let!(:org2_user_collection) do
        # Create user collection manually
        # To make sure being in an org isn't coupled with being a group member/admin
        Collection::UserCollection.find_or_create_for_user(user, organization2)
      end

      it 'sets user settings to the switched org' do
        expect(user.switch_to_organization(organization)).to be_truthy
        expect(user.current_organization).to eq(organization)
        expect(user.current_user_collection).to eq(org_user_collection)
        # second org
        expect(user.switch_to_organization(organization2)).to be_truthy
        expect(user.current_organization).to eq(organization2)
        expect(user.current_user_collection).to eq(org2_user_collection)
      end
    end

    context 'if setting to nil' do
      before do
        user.switch_to_organization(organization)
      end

      it 'sets current_organization to nil' do
        expect(user.current_organization).not_to be_nil
        user.switch_to_organization(nil)
        expect(user.current_organization).to be_nil
      end

      it 'sets current_user_collection to nil' do
        expect(user.current_user_collection).not_to be_nil
        expect(user.switch_to_organization(nil)).to be_truthy
        expect(user.current_user_collection).to be_nil
      end
    end

    context 'with no user collection in that org' do
      let!(:other_org) { create(:organization_without_groups) }

      it 'returns nil' do
        # can't switch to the org
        expect(user.switch_to_organization(other_org)).to be_nil
      end
    end

    context 'as a super admin' do
      before do
        user.add_role(Role::SUPER_ADMIN)
      end

      context 'with a user collection' do
        it 'sets current_user_collection' do
          expect(user.current_user_collection).to be_nil
          expect(user.switch_to_organization(organization)).to be_truthy
          expect(user.current_user_collection).to eq(org_user_collection)
        end
      end

      context 'without a user collection on that org' do
        let!(:template_collection) { create(:global_collection) }
        let!(:other_org) { create(:organization_without_groups, template_collection: template_collection) }

        it 'switches to the org and sets current_user_collection to the org template_collection' do
          expect(user.switch_to_organization(other_org)).to be_truthy
          expect(user.current_organization).to eq(other_org)
          expect(user.current_user_collection).to eq(other_org.template_collection)
        end
      end
    end
  end

  context 'abilities for viewing and editing' do
    let(:ability) { Ability.new(user) }
    let(:collection) { create(:collection) }
    before do
      # in this context, this works better than `add_editors [user]`
      user.add_role(Role::EDITOR, collection)
    end

    context 'with pending user' do
      let(:user) { create(:user, status: User.statuses[:pending], terms_accepted: false) }

      it 'does not allow any access to content' do
        expect(ability).not_to be_able_to(:read, collection)
      end
    end

    context 'with active user who has not accepted their org terms' do
      let(:organization) { create(:organization, terms_version: 2, terms_text_item: create(:text_item)) }
      let(:user) { create(:user, terms_accepted: false, current_organization: organization) }

      it 'allows read only access to content' do
        expect(ability).not_to be_able_to(:create, Collection.new)
        expect(ability).to be_able_to(:read, collection)
        expect(ability).not_to be_able_to(:update, collection)
        expect(ability).not_to be_able_to(:destroy, collection)
      end
    end

    context 'with fully activated user' do
      let(:user) { create(:user) }

      it 'allows edit access to content' do
        expect(ability).to be_able_to(:create, Collection.new)
        expect(ability).to be_able_to(:read, collection)
        expect(ability).to be_able_to(:update, collection)
        expect(ability).to be_able_to(:destroy, collection)
      end
    end
  end

  context 'network admin management' do
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      allow(NetworkOrganizationUserSyncWorker).to receive(:perform_async)
    end

    describe '#add_network_admin' do
      it 'returns early when the user uid is not set' do
        pending_user = create(:user, :pending)
        expect(NetworkOrganizationUserSyncWorker).not_to receive(:perform_async)
        expect(pending_user.add_network_admin(organization.id)).to be true
      end

      it 'uses the network api to add the user as org admin' do
        user.add_network_admin(organization.id)
        expect(NetworkOrganizationUserSyncWorker).to have_received(:perform_async).with(user.uid, organization.id, NetworkApi::Organization::ADMIN_ROLE, :add)
      end
    end

    describe '#remove_network_admin' do
      it 'returns early when the user uid is not set' do
        pending_user = create(:user, :pending)
        expect(NetworkOrganizationUserSyncWorker).not_to receive(:perform_async)
        expect(pending_user.add_network_admin(organization.id)).to be true
      end

      it 'uses the network api to remove the user as org admin' do
        user.remove_network_admin(organization.id)
        expect(NetworkOrganizationUserSyncWorker).to have_received(:perform_async).with(user.uid, organization.id, NetworkApi::Organization::ADMIN_ROLE, :remove)
      end
    end
  end

  describe '#in_my_collection' do
    let(:user_collection) { create(:user_collection) }
    let(:card_in_collection) { create(:collection_card_collection, parent: user_collection) }
    let(:link_in_collection) { create(:collection_card_link_collection, parent: user_collection) }
    let(:card_not_in_collection) { create(:collection_card_collection) }

    before do
      allow(user).to receive(:current_user_collection).and_return(user_collection)
    end

    it 'should return true if collection is in user collection' do
      expect(user.in_my_collection?(card_in_collection.collection)).to be true
    end
    it 'should return true if collection is linked into user collection' do
      expect(user.in_my_collection?(link_in_collection.collection)).to be true
    end
    it 'should return false if collection is not in user collection' do
      expect(user.in_my_collection?(card_not_in_collection.collection)).to be false
    end
  end

  describe '#archive!' do
    it 'archives the user' do
      # -- worker is disabled, see note in user.rb
      # expect(DeprovisionUserWorker).to receive(:perform_async).with(user.id)
      expect(user).to receive(:archived!)
      user.archive!
    end
  end

  describe '#network_user' do
    let(:user) { create(:user) }

    it 'should look up the user from the Network' do
      expect(NetworkApi::User).to receive(:find).with(user.uid).and_return([])
      user.network_user
    end
  end

  describe '#incentive_due_date' do
    let(:user) { create(:user) }
    let(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, :payment, sample_size: 2, price_per_response: 4.50, test_collection: test_collection) }

    it 'is nil without a balance' do
      expect(user.incentive_owed_account_balance.to_f).to eq(0.0)
      expect(user.incentive_paid_account_balance.to_f).to eq(0.0)
      expect(user.incentive_due_date).to be_nil
    end

    # Truncation must be used when testing double entry
    context 'with a balance', truncate: true do
      let!(:paid_survey_response) { create(:survey_response, user: user, test_audience: test_audience) }
      let!(:unpaid_survey_response) { create(:survey_response, user: user, test_audience: test_audience) }
      let!(:prev_survey_completed_at) { 3.days.ago }

      before do
        # Add balance to revenue_deferred account so we can debit from it
        DoubleEntry.transfer(
          Money.new(10_00 * 100),
          from: DoubleEntry.account(:cash, scope: test_audience.payment),
          to: DoubleEntry.account(:revenue_deferred, scope: test_audience.payment),
          code: :purchase,
        )
        # Mock out methods so we don't have to complete the response in this spec
        allow_any_instance_of(SurveyResponse).to receive(:completed?).and_return(true)
        Timecop.travel prev_survey_completed_at do
          paid_survey_response.record_incentive_owed!
          paid_survey_response.record_incentive_paid!
          unpaid_survey_response.record_incentive_owed!
        end
      end

      it 'is first incentive created_at + waiting period' do
        expect(user.incentive_owed_account_balance.to_f).to eq(unpaid_survey_response.potential_incentive)
        expect(user.incentive_paid_account_balance.to_f).to eq(paid_survey_response.amount_earned)
        expect(user.incentive_due_date).to be_within(0.6).of(
          prev_survey_completed_at + Audience::PAYMENT_WAITING_PERIOD,
        )
      end

      it 'is nil after paid' do
        Accounting::RecordTransfer.incentive_paid(unpaid_survey_response)
        expect(user.incentive_due_date).to be_nil
        expect(user.incentive_owed_account_balance.to_f).to eq(0.0)
        expect(user.incentive_paid_account_balance.to_f).to eq(unpaid_survey_response.amount_earned + paid_survey_response.amount_earned)
      end
    end
  end
end
