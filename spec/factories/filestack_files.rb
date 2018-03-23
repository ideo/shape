FactoryBot.define do
  factory :filestack_file do
    url 'https://cdn.filestackcontent.com/cc8rnrhQcqaZwasMJIJb'
    handle 'cc8rnrhQcqaZwasMJIJb'
    size 716_198
    mimetype 'image/jpeg'
    filename { Faker::File.file_name }
  end
end
