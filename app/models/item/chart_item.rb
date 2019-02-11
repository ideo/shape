class Item
  class ChartItem < Item
    belongs_to :data_source, polymorphic: true, optional: true

    def chart_data
      if data_source_type == 'Item::QuestionItem'
        DataSource::QuestionItem.call(
          chart_item: self,
          question_item: data_source,
        )
      elsif url.present?
        DataSource::External.call(
          chart_item: self,
        )
      else
        {}
      end
    end
  end
end
