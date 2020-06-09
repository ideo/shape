namespace :challenge do
  desc 'Create challenge audience and assign to organization'
  task initialize_challenge_audiences: :environment do
    %w[Admin Reviewer Participant].each do |audience_name|
      Audience.create(name: audience_name, audience_type: :challenge)
    end
  end
end
