# NOTE: since this generates local tmp files, it makes sense to dump prod -> local and then run this locally
require 'fileutils'
namespace :moon_csv do
  desc 'generate moon CSVs'
  task generate: :environment do
    # look up KPI tracker collection
    kpi_tracker = Collection.find('206141')
    data_items = kpi_tracker.items.data_items

    FileUtils.mkdir_p Rails.root.join('tmp', 'moon')

    # loop through data items, only finding the participant/viewer weekly/monthly ones
    data_items.each do |di|
      ds = di.datasets.first
      next if ds.timeframe == 'ever' || ds.measure == 'content' || ds.measure == 'activity'

      name = ds.data_source&.name || ds.organization.name
      name = "#{name}-#{ds.timeframe}-#{ds.measure}"
      puts "reporting on dataset #{ds.id}; #{name}..."

      # generate report numbers grouped by Moon Group
      csv = DataReport::GroupActivity.call(dataset: ds, start_date_limit: 14.months.ago)
      File.open(Rails.root.join('tmp', 'moon', "#{name}-#{Date.today}.csv"), 'w') do |file|
        file.write(csv)
      end
    end
  end
end
