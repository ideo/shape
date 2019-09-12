require 'rails_helper'

describe NetworkUserUpdateWorker, type: :worker do
  let(:network_user) { double('network_user') }
  let(:user) { create(:user, locale: 'es') }
  subject { NetworkUserUpdateWorker.new }

  before do
    allow(network_user).to receive(:update)
    allow(network_user).to receive(:locale)
    expect(NetworkApi::User).to receive(:find).with(user.uid).and_return([network_user])
  end

  describe '#perform' do
    it 'should update the network user locale' do
      expect(network_user).to receive(:update).with(locale: 'es')
      subject.perform(user.id, locale: 'es')
    end

    it 'should update the network user terms_accepted_version' do
      expect(network_user).to receive(:update).with(terms_accepted_version: Rails.configuration.terms_version)
      subject.perform(user.id, terms_accepted_version: Rails.configuration.terms_version)
    end
  end
end
