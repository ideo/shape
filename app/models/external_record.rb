# == Schema Information
#
# Table name: external_records
#
#  id                  :bigint(8)        not null, primary key
#  externalizable_type :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  application_id      :bigint(8)
#  external_id         :string
#  externalizable_id   :bigint(8)
#
# Indexes
#
#  index_external_records_common_fields      (external_id,application_id,externalizable_type,externalizable_id)
#  index_external_records_on_application_id  (application_id)
#  index_on_externalizable                   (externalizable_type,externalizable_id)
#

class ExternalRecord < ApplicationRecord
  belongs_to :application
  # `optional` mostly to allow building records e.g. when creating along with a group
  belongs_to :externalizable, polymorphic: true, optional: true

  amoeba do
    enable
  end

  def external_id_to_integer
    return nil if external_id.nil?
    external_id.match(/\d+/).to_s.to_i
  end
end
