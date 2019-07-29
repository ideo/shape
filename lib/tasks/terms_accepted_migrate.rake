namespace :terms_accepted do
  desc 'migrate to new data format'
  task migrate: :environment do
    orgs_with_terms = Organization.where.not(terms_text_item_id: nil).includes(:terms_text_item)
    orgs_with_term_ids = orgs_with_terms.pluck(:id)
    # initialize all orgs with terms to be on version 1
    orgs_with_terms.update_all(terms_version: 1)

    total = User.count
    puts "processing #{total} users"
    User.find_in_batches.each_with_index do |batch, i|
      puts "Starting batch #{i}"
      batch.each do |user|
        user.terms_accepted = user.terms_accepted_in_database
        user.feedback_terms_accepted = user.feedback_terms_accepted_in_database
        user.respondent_terms_accepted = user.respondent_terms_accepted_in_database

        user_orgs_with_terms = user.organization_ids & orgs_with_term_ids
        if user_orgs_with_terms.present?
          user_orgs_with_terms.each do |org_id|
            user.org_terms_accepted_versions ||= {}
            user.org_terms_accepted_versions[org_id.to_s] = user.terms_accepted ? 1 : nil
          end
        end

        user.save
      end
    end
  end
end
