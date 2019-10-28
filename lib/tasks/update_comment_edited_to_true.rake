namespace :comments do
  desc 'Update comments that were already edited'
  task update_to_edited: :environment do
    Comment.where(edited:false).find_each(batch_size: 500).select{|c| c.updated_at > c.created_at}.map{|c| c.message}
  end
end
