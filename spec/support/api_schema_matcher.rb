# Inspired by Thoughtbot
# https://robots.thoughtbot.com/validating-json-schemas-with-an-rspec-matcher
RSpec::Matchers.define :match_json_schema do |schema_name, opts = { strict: true }|
  match do |json|
    schema_directory = File.join(Dir.pwd, 'spec', 'support', 'api', 'schemas')
    validator = JSONSchemaValidator.new(schema_directory)
    validator.validate!(schema_name, json, opts)
  end
end
