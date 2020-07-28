require 'rails_helper'

describe TestsController, type: :request do
  include IdeoSsoHelper
  let(:user) { @user }

  before do
    # NOTE: not doing any normal rendering of the index page because we defer to Cypress for those,
    # and they make for slow request specs
    allow_any_instance_of(TestsController).to receive(:render).and_return 'rendered.'
  end

  describe 'GET #show' do
    let(:test_audiences) { test_collection.test_audiences }
    let(:path) { "/tests/#{test_collection.id}" }

    context 'with a closed test' do
      let(:test_collection) { create(:test_collection, test_status: :closed) }

      it 'sets invalid = true' do
        get(path)
        expect(response.status).to eq 200
        expect(assigns(:invalid)).to be true
      end
    end

    context 'with a normal open test (link sharing enabled by default)' do
      let(:test_collection) { create(:test_collection, :launched) }

      it 'sets invalid = false' do
        get(path)
        expect(response.status).to eq 200
        expect(assigns(:invalid)).to be false
      end
    end

    context 'with a ta param for test audience' do
      let(:test_collection) { create(:test_collection, :launched, :with_test_audience) }
      let(:test_audience) { test_collection.test_audiences.paid.first }
      let(:path) { "/tests/#{test_collection.id}?ta=#{test_audience.id}" }
      before do
        test_audiences.link_sharing.first.update(status: :closed)
      end

      context 'when test audience is open' do
        it 'sets test_audience; invalid = false' do
          get(path)
          expect(response.status).to eq 200
          expect(assigns(:test_audience)).to eq test_audience
          expect(assigns(:invalid)).to be false
        end
      end

      context 'when test audience is closed' do
        before do
          test_audience.update(status: :closed)
        end

        it 'sets test_audience = nil; invalid = true' do
          get(path)
          expect(response.status).to eq 200
          expect(assigns(:test_audience)).to be nil
          expect(assigns(:invalid)).to be true
        end
      end
    end

    context 'inside a challenge', auth: true do
      let(:test_collection) { create(:test_collection, :launched) }
      let!(:challenge) do
        create(:collection,
               name: 'Challenge',
               collection_type: 'challenge')
      end

      context 'with link sharing not enabled' do
        before do
          test_audiences.first.update(status: :closed)
        end

        it 'sets invalid = true' do
          get(path)
          expect(response.status).to eq 200
          expect(assigns(:invalid)).to be true
        end

        context 'with a valid test audience' do
          let(:submission_box) { create(:submission_box, :with_submissions_collection, parent_collection: challenge) }
          let(:submission) { create(:collection, :submission, parent_collection: submission_box.submissions_collection) }
          let(:submission_template) { create(:collection, master_template: true, parent_collection: submission_box) }
          let(:master_test) do
            create(:test_collection, parent_collection: submission_template, master_template: true)
          end
          let!(:test_collection) do
            create(:test_collection, :with_reviewers_audience, :launched, parent_collection: submission, template_id: master_test.id)
          end
          before do
            submission.update(submission_attrs: { submission: true, launchable_test_id: test_collection.id })
            user.add_role(Role::MEMBER, challenge.challenge_reviewer_group)
          end

          it 'sets invalid = false' do
            get(path)
            expect(response.status).to eq 200
            expect(assigns(:invalid)).to be false
          end
        end
      end

      context 'with link sharing enabled' do
        it 'sets invalid = false' do
          get(path)
          expect(response.status).to eq 200
          expect(assigns(:invalid)).to be false
        end
      end
    end
  end

  describe 'GET #token_auth' do
    let(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, test_collection: test_collection) }
    let(:user) { create(:user, status: :limited) }
    let(:token) { 'xyz' }
    let(:path) { "/tests/t/#{token}" }
    let(:fake_user_token) { 'my-token-123' }

    before do
      allow_any_instance_of(User).to receive(:generate_network_auth_token).and_return(fake_user_token)
    end

    context 'with a matching invitation' do
      let(:test_audience_invitation) { create(:test_audience_invitation, test_audience: test_audience, user: user) }
      let(:token) { test_audience_invitation.invitation_token }

      it 'should redirect to ideo_sso_token_auth_url' do
        get(path)
        expect(response).to redirect_to ideo_sso_token_auth_url(fake_user_token)
      end
    end

    context 'without a matching invitation' do
      it 'should redirect to root_url' do
        get(path)
        expect(response).to redirect_to root_url
      end
    end
  end
end
