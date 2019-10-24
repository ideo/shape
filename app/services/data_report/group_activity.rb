# Right now this has been used to generate a report of "all groups" within Moon
module DataReport
  class GroupActivity < SimpleService
    def initialize(dataset:)
      @dataset = dataset
      @data = {}
    end

    def call
      merge_group_data
      generate_csv
    end

    private

    def groups
      # don't include the main org groups; just the created ones
      @groups ||= @dataset.organization.groups.active.reject(&:org_group?)
    end

    def merge_group_data
      groups.each do |group|
        self.dataset_group = group
        data = @dataset.data
        data.each do |val|
          @data[val[:date]] ||= {}
          @data[val[:date]][group.id] = val[:value]
        end
      end
    end

    def dataset_group=(group)
      @dataset.groupings = [{ 'type': 'Group', 'id': group.id }]
    end

    def generate_csv
      CSV.generate do |csv|
        # headers
        csv << %w[date] + groups.map(&:name)

        # body
        @data.sort.each do |date, vals|
          row = [date]
          groups.each do |group|
            row << vals[group.id] || 0
          end
          csv << row
        end
      end
    end
  end
end
