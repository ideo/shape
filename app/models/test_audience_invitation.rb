class TestAudienceInvitation < ApplicationRecord
  belongs_to :test_audience
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
