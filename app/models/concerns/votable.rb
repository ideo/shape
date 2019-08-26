module Votable
  extend ActiveSupport::Concern

  included do
    has_many :votes, as: :votable
  end

  def num_votes
    votes.count
  end

  def vote!(user_id)
    vote_scope(user_id).first_or_create
  end

  def unvote!(user_id)
    vote_scope(user_id).first&.destroy
  end

  private

  def vote_scope(user_id)
    Vote.where(
      votable_type: self.class.base_class.name,
      votable_id: id,
      user_id: user_id
    )
  end
end
