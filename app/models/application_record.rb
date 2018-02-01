class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  # override this so we can reclaim `type` for our own purposes
  def self.inheritance_column
    'inheritance_type'
  end
end
