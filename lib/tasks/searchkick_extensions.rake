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
end

def reindex_models(klasses)
  klasses.each do |klass|
    klass.search_import.find_in_batches.with_index do |batch, i|
      puts "Reindexing #{klass} batch #{i}... size: #{batch.count}"
      klass.searchkick_index.import(batch)
    end
  end
end
