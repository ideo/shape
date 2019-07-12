class DemographicsConfig
  def initialize
    @config = YAML.load_file('demographics-config.yml')
  end

  # returns [<group, name, categoryKey, criteria => [<name, criteriaKey>, ...]>, ...]
  def query_categories
    @config['query_categories'].map do |category|
      {
        group: category['group'],
        name: category['name'],
        categoryKey: category['category_key'],
        criteria: category['criteria'].map do |criterion|
          {
            name: criterion['name'],
            criteriaKey: criterion['criteria_key'],
          }
        end,
      }
    end
  end
end
