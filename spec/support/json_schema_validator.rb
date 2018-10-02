class JSONSchemaValidator
  def initialize(dir)
    @dir = dir
    # add_schemas
  end

  def validate!(schema_name, json, opts = {})
    JSON::Validator.validate!(schema_path(schema_name), json, opts)
  end

  private

  attr_accessor :dir

  def add_schemas
    all_schemas.each do |schema|
      JSON::Validator.add_schema(schema)
    end
  end

  def all_schemas
    Dir.glob("#{dir}/*.json").map do |fullpath|
      json = JSON.parse(File.read(fullpath))

      JSON::Schema.new(json, fullpath)
    end
  end

  def schema_path(schema_name)
    File.join(dir, "#{schema_name}.json")
  end
end
