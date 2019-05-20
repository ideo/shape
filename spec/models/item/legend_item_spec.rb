require 'rails_helper'

RSpec.describe Item::LegendItem, type: :model do
  let(:legend_item) { create(:legend_item) }
  let!(:data_item) do
    create(
      :data_item,
      :report_type_record,
      legend_item: legend_item,
    )
  end
end
