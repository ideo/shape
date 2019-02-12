class Item
  class ChartItem < Item
    belongs_to :data_source, polymorphic: true, optional: true

    def chart_data
      if url.present?
        DataSource::External.call(
          chart_item: self,
        )
      elsif data_source.is_a?(Item::QuestionItem)
        DataSource::QuestionItem.call(
          chart_item: self,
          question_item: data_source,
        )
      else
        {}
      end
    end
  end
end
