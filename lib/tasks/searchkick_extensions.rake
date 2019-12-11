# adapted from:
# https://github.com/ankane/searchkick/blob/master/lib/tasks/searchkick.rake
# https://github.com/ankane/searchkick/issues/334#issuecomment-262855717
namespace :searchkick do
  desc 'efficiently reindex models'
  task batch_reindex: :environment do
    if ENV['CLASSES']
      klasses = ENV['CLASSES'].split(',').map(&:constantize)
      reindex_models(klasses)
    else
      abort 'USAGE: rake searchkick:batch_reindex CLASSES=User,Collection'
    end
  end

  namespace :batch_reindex do
    desc 'reindex all models'
    task all: :environment do
      klasses = [User, Group, Item, Collection]
      reindex_models(klasses)
    end
  end

  task new_search_data: :environment do
    find_search_import_in_batches
  end

  task new_user_search_data: :environment do
    total = User.search_import.count
    agg = 0
    User.search_import.find_in_batches.with_index do |batch, i|
      agg += batch.count
      puts "Reindexing User batch #{i}... #{agg}/#{total}"
      User.search_import.where(id: batch.pluck(:id)).reindex(:new_search_data)
    end
  end

  task reindex_collections_items_last_week: :environment do
    [Collection, Item].each do |klass|
      scope = klass.where('updated_at > ?', 1.week.ago)
      agg = 0
      total = scope.count
      scope
      .find_in_batches
      .with_index do |batch, i|
        agg += batch.count
        puts "Reindexing #{klass} batch #{i}... #{agg}/#{total}"
        klass.searchkick_index.import(batch)
      end
    end
  end
end

def reindex_models(klasses)
  klasses.each do |klass|
    total = klass.search_import.count
    agg = 0
    klass.search_import.find_in_batches.with_index do |batch, i|
      agg += batch.count
      puts "Reindexing #{klass} batch #{i}... #{agg}/#{total}"
      klass.searchkick_index.import(batch)
    end
  end
end

def find_search_import_in_batches
  [Collection, Item].each do |klass|
    total = klass.search_import.count
    agg = 0
    klass.search_import.find_in_batches.with_index do |batch, i|
      agg += batch.count
      puts "Reindexing #{klass} batch #{i}... #{agg}/#{total}"
      klass.search_import.where(id: batch.pluck(:id)).reindex(:new_search_data)
    end
  end
end
