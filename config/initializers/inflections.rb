# Be sure to restart your server when you modify this file.

ActiveSupport::Inflector.inflections(:en) do |inflect|
  # do not singularize criteria to criterium
  inflect.uncountable 'audience_demographic_criteria'
end
