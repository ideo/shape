# == Schema Information
#
# Table name: sections
#
#  id         :bigint(8)        not null, primary key
#  col        :integer
#  height     :integer
#  name       :string
#  row        :integer
#  width      :integer
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  parent_id  :bigint(8)
#
# Indexes
#
#  index_sections_on_parent_id  (parent_id)
#

class Section < ApplicationRecord
  belongs_to :parent, class_name: 'Collection'
end
