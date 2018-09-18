require 'csv'

class GciExport
  PROJECTS_ID = 6449
  PROFILES_ID = 5177

  def self.user_report
    profiles = Collection.find PROFILES_ID
    CSV.generate do |csv|
      csv << [
        'person name',
        'profile url',
        'last sign in',
        'profile last update',
        'total comments by user',
        'other activities by user',
        'profile comments',
        'profile other activities',
        # 'days active in last 2 months',
      ]
      profiles.collections.find_each do |profile|
        user = profile.created_by
        next unless user.present?
        profile_items = Item.in_collection(profile)
        item_activities_count = profile_items.collect{|i| i.activities.where.not(action: [:commented, :mentioned]).count }.sum
        row = [
          user.name,
          "https://www.shape.space/network-leads/collections/#{profile.id}",
          user.last_sign_in_at,
          profile.updated_at,
          user.comments.count,
          user.activities_as_actor.where.not(action: [:commented, :mentioned]).count,
          profile.try(:comment_thread).try(:comments).try(:count) || 0,
          profile.activities.where.not(action: [:commented, :mentioned]).count + item_activities_count,
        ]
        csv << row
      end
    end
  end

  def self.projects_report
    projects = Collection.find PROJECTS_ID
    CSV.generate do |csv|
      csv << [
        'project name',
        'project url',
        'project last update',
        'project total actions (comments, edits)',
      ]
      projects.collections.find_each do |project|
        proj_items = Item.in_collection(project)
        item_activities_count = proj_items.collect{|i| i.activities.count }.sum
        row = [
          project.name,
          "https://www.shape.space/network-leads/collections/#{project.id}",
          [project.updated_at, proj_items.collect(&:updated_at).max].max,
          project.activities.count + item_activities_count,
        ]
        csv << row
      end
    end
  end
end