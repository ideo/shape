require 'csv'

class GciExport
  PROJECTS_ID = 6449
  PROFILES_ID = 5177

  def self.item_contents(item)
    if item.is_a? Item::FileItem
      item.filestack_file_url
    elsif item.is_a? Item::TextItem
      item.plain_content(splitter: "\n")
    end
  end

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

        'image url',
        'info',
        'give get goal',
        'about me',
        'whiteboard space',
      ]
      profiles.collections.find_each do |profile|
        user = profile.created_by
        next unless user.present?
        profile_items = Item.in_collection(profile)
        item_activities_count = profile_items.collect { |i| i.activities.where.not(action: %i[commented mentioned]).count }.sum
        row = [
          user.name,
          "https://www.shape.space/network-leads/collections/#{profile.id}",
          user.last_sign_in_at,
          profile.updated_at,
          user.comments.count,
          user.activities_as_actor.where.not(action: %i[commented mentioned]).count,
          profile.try(:comment_thread).try(:comments).try(:count) || 0,
          profile.activities.where.not(action: %i[commented mentioned]).count + item_activities_count,
        ]

        profile.items.limit(5).each do |item|
          row << item_contents(item)
        end
        csv << row
      end
    end
  end

  def self.projects_report
    projects = Collection.find PROJECTS_ID
    CSV.generate do |csv|
      headers = [
        'project name',
        'project url',
        'project last update',
        'project total actions (comments, edits)',
      ]
      3.times do |i|
        headers << "editor_#{i + 1} email"
        headers << "editor_#{i + 1} name"
      end
      30.times do |i|
        headers << "card_#{i + 1}"
      end
      csv << headers
      projects.collections.find_each do |project|
        proj_items = Item.in_collection(project)
        item_activities_count = proj_items.collect { |i| i.activities.count }.sum
        row = [
          project.name,
          "https://www.shape.space/network-leads/collections/#{project.id}",
          [project.updated_at, proj_items.collect(&:updated_at).max].max,
          project.activities.count + item_activities_count,
        ]
        editors = project.editors[:users].where.not('email LIKE ?', '%ideo.com')
        3.times do |i|
          if (editor = editors.try(:[], i))
            row << editor.email
            row << editor.name
          else
            row << ''
            row << ''
          end
        end
        project.items.limit(30).each do |item|
          row << item_contents(item)
        end
        csv << row
      end
    end
  end
end
