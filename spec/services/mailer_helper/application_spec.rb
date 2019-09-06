require 'rails_helper'

RSpec.describe MailerHelper::Application, type: :service do
  delegate :url_helpers, to: 'Rails.application.routes'
  before { network_organization_doubles }
  let(:organization) { create(:organization, name: 'Company') }
  let(:group) { create(:group, name: 'C∆ - Business Unit Admins', organization: organization) }
  let(:invited_to) { group }
  let(:application) do
    create(
      :application,
      name: 'Creative Difference',
      invite_cta: 'View Your Results',
      invite_url: 'https://creativedifference.ideo.com/shape',
      email: 'help@ideocreativedifference.com',
      logo_url: 'https://creativedifference.ideo.com/logo.png',
    )
  end
  let(:invited_by) { create(:user) }
  let(:user) { create(:user) }
  subject do
    MailerHelper::Application.new(
      application: application,
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
    it 'returns app name' do
      expect(subject.name).to eq('Creative Difference')
    end
  end

  describe '#email' do
    it 'returns app email' do
      expect(subject.email).to eq(
        'help@ideocreativedifference.com',
      )
    end
  end

  describe '#invite_subject' do
    it 'returns subject with context' do
      expect(subject.invite_subject).to eq(
        'Your invitation to Company’s Creative Difference Dashboard',
      )
    end
  end

  describe '#invite_message' do
    it 'returns contextual message' do
      expect(subject.invite_message).to eq(
        "You've been invited to join Company’s Creative Difference account to view" \
        ' Business Unit’s results. To view your results, please click on the button below.',
      )
    end
  end

  describe '#invite_url' do
    it 'returns app invite_url' do
      expect(subject.invite_url).to eq(
        "https://creativedifference.ideo.com/shape?redirect=#{CGI.escape(url_helpers.root_url + 'company/')}",
      )
    end

    context 'with pending user' do
      let!(:user) { create(:user, :pending) }

      it 'returns app invite url with invite redirect' do
        accept_invite_url = url_helpers.accept_invitation_url(
          token: user.invitation_token,
        )
        expect(subject.invite_url).to eq(
          "https://creativedifference.ideo.com/shape?redirect=#{CGI.escape(accept_invite_url)}",
        )
      end
    end
  end

  describe '#invite_from_email' do
    it 'returns app email' do
      expect(subject.invite_from_email).to eq(
        'Creative Difference <help@ideocreativedifference.com>',
      )
    end
  end

  describe '#invite_cta' do
    it 'returns app cta' do
      expect(subject.invite_cta).to eq('View Your Results')
    end
  end

  describe '#logo_url' do
    it 'returns app logo url' do
      expect(subject.logo_url).to eq(
        'https://creativedifference.ideo.com/logo.png',
      )
    end
  end

  describe '#branding_byline' do
    it 'returns Shape' do
      expect(subject.branding_byline).to eq(
        'Creative Difference and Shape',
      )
    end
  end

  describe '#default?' do
    it 'returns false' do
      expect(subject.default?).to be false
    end
  end
end
