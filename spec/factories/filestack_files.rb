FactoryBot.define do
  factory :filestack_file do
    url 'https://cdn.filestackcontent.com/cc8rnrhQcqaZwasMJIJb'
    handle 'cc8rnrhQcqaZwasMJIJb'
    size 716_198
    mimetype 'image/jpeg'
    filename { Faker::File.file_name }
  end

  factory :filestack_pdf_file, class: 'FilestackFile' do
    url 'https://cdn.filestackcontent.com/something.pdf'
    handle 'some-pdf-handle'
    size 896_198
    mimetype 'application/pdf'
    filename { Faker::File.file_name }
  end
end
