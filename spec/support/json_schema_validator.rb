class JSONSchemaValidator
  def initialize(dir)
    @dir = dir
    # add_schemas
  end

  def validate!(schema_name, json)
    JSON::Validator.validate!(schema_path(schema_name), json, strict: true)
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
      ext = File.extname(fullpath)
      filename = File.basename(fullpath)
      name = File.basename(fullpath, ext)
      json = JSON.parse(File.read(fullpath))

      JSON::Schema.new(json, fullpath)
    end
  end

  def schema_path(schema_name)
    File.join(dir, "#{schema_name}.json")
  end
end
