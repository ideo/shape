# == Schema Information
#
# Table name: global_translations
#
#  id         :bigint(8)        not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class GlobalTranslation < ApplicationRecord
  include Globalizable

  translates_custom :value
end
