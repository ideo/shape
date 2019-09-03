require 'rails_helper'

RSpec.describe MailerHelper::Shape, type: :service do
  delegate :url_helpers, to: 'Rails.application.routes'
  before { network_organization_doubles }
  let(:organization) { create(:organization, name: 'Company') }
  let(:group) { create(:group, name: 'VIP', organization: organization) }
  let(:invited_to) { group }
  let(:invited_by) { create(:user) }
  let(:user) { create(:user) }
  subject do
    MailerHelper::Shape.new(
      invited_to_type: 'Group',
      invited_to: invited_to,
      invited_by: invited_by,
      user: user,
    )
  end
  before do
    organization.save # to generate slug
  end

  describe '#name' do
    it 'returns Shape' do
      expect(subject.name).to eq('Shape')
    end
  end

  describe '#email' do
    it 'returns Shape email' do
      expect(subject.email).to eq('hello@shape.space')
    end
  end

  describe '#invite_subject' do
    it 'returns subject with context' do
      expect(subject.invite_subject).to eq(
        'Your invitation to "VIP" on Shape',
      )
    end
  end

  describe '#invite_message' do
    it 'returns contextual message' do
      expect(subject.invite_message).to eq(
        "#{invited_by.name} has invited you to join Company’s \"VIP\" group on Shape.",
      )
    end
  end

  describe '#invite_url' do
    it 'returns front-end url for group' do
      expect(subject.invite_url).to eq(
        'http://test.shape.com/company/',
      )
    end

    context 'if invited to a collection' do
      let(:collection) { create(:collection, organization: organization) }
      let(:invited_to) { collection }

      it 'returns url for collection' do
        expect(subject.invite_url).to eq(
          "http://test.shape.com/company/collections/#{collection.id}",
        )
      end
    end

    context 'with pending user' do
      let!(:user) { create(:user, :pending) }

      it 'returns app invite url with invite redirect' do
        expect(subject.invite_url).to eq(
          url_helpers.accept_invitation_url(
            token: user.invitation_token,
          )
        )
      end
    end
  end

  describe '#invite_cta' do
    it 'returns group cta' do
      expect(subject.invite_cta).to eq('Join Group')
    end
  end

  describe '#invite_from_email' do
    it 'returns Shape email' do
      expect(subject.invite_from_email).to eq('Shape <hello@shape.space>')
    end
  end

  describe '#logo_url' do
    it 'returns Shape logo url' do
      expect(subject.logo_url).to eq(
        'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo_2x.png',
      )
    end
  end

  describe '#branding_byline' do
    it 'returns Shape' do
      expect(subject.branding_byline).to eq('Shape')
    end
  end

  describe '#default?' do
    it 'returns true' do
      expect(subject.default?).to be true
    end
  end
end
