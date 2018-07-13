class Notification < ApplicationRecord
  include Firestoreable

  belongs_to :activity
  belongs_to :user

  def combined_actor_ids(limit: nil)
    # make this method universal to support both combined and individual activities
    activity_ids = combined_activities_ids
    activity_ids = [activity.id] if activity_ids.empty?
    Activity
      .select(:actor_id, 'max(created_at) as created')
      .where(id: activity_ids)
      .order('created DESC')
      .group(:actor_id)
      .limit(limit)
      .to_a # otherwise pluck will turn it into an incorrect query
      .pluck(:actor_id)
  end

  def combined_actor_count
    combined_actor_ids.count
  end

  def combined_actors(limit: 3)
    User.where(id: combined_actor_ids(limit: limit))
  end

  def relationships_for_firestore
    if try(:activity).try(:target).try(:archived?)
      [
        activity: %i[actor subject_users subject_groups target],
      ]
    else
      [
        :combined_actors,
        activity: %i[actor subject_users subject_groups],
      ]
    end
  end

  def serialized_for_firestore
    renderer = JSONAPI::Serializable::Renderer.new
    renderer.render(
      self,
      class: Firestoreable::JSONAPI_CLASS_MAPPINGS,
      include: relationships_for_firestore,
    )
  end

  def remove_from_firestore
    obj = FirestoreClient.new.read("notifications/#{id}")
    obj&.delete
  end
end
