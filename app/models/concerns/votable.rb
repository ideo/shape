module Votable
  extend ActiveSupport::Concern

  included do
    has_many :votes, as: :votable
  end

  def num_votes
    votes.count
  end

  def vote!(user_id)
    votes.where(user_id: user_id).first_or_create
  end

  def unvote!(user_id)
    votes.where(user_id: user_id).first&.destroy
  end
end
