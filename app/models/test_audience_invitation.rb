# == Schema Information
#
# Table name: test_audience_invitations
#
#  id               :bigint(8)        not null, primary key
#  completed_at     :datetime
#  invitation_token :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  test_audience_id :bigint(8)
#  user_id          :bigint(8)
#

class TestAudienceInvitation < ApplicationRecord
  belongs_to :test_audience, optional: true
  belongs_to :user
  delegate :test_collection, to: :test_audience

  before_create :generate_uniq_invitation_token

  validates :user_id,
            uniqueness: { scope: :test_audience_id }

  scope :valid, -> { where.not(invitation_token: nil) }

  def complete!
    update(completed_at: Time.current, invitation_token: nil)
  end

  private

  def generate_uniq_invitation_token
    generate_invitation_token
    generate_invitation_token while self.class.valid.find_by(invitation_token: invitation_token)
  end

  def generate_invitation_token
    self.invitation_token = SecureRandom.alphanumeric(12)
  end
end
