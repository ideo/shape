module Slack
  class Unfurl
    include Interactor
    include Slack::Common

    delegate_to_context :channel, :message_ts, :links
    require_in_context :channel, :message_ts, :links

    def call
      client.chat_unfurl(
        channel: channel,
        ts: message_ts,
        unfurls: modified_links.to_json,
      )
    end

    private

    def modified_links
      unfurls = {}
      links.each do |link|
        url = link[:url]
        unpacked = url.split('/')
        id = unpacked.last.to_i
        record_type = unpacked.second_to_last
        klass = record_type.classify.safe_constantize
        record = klass.find(id)
        unfurls[url] = message_data(record, url)
      end
      unfurls
    end

    def message_data(record, url)
      cover = record.try(:cached_cover) || {}
      image_url = ''
      image_handle = cover['image_handle']
      if record.is_a?(Item::FileItem)
        image_handle = record.filestack_file.handle
      end
      if image_handle
        process_url = "https://process.filestackapi.com/#{ENV['FILESTACK_API_KEY']}/resize=width:300/"
        image_url = "#{process_url}/#{image_handle}"
      end
      {
        mrkdwn_in: %w[text pretext],
        author_name: 'Shape',
        author_icon: 'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo-no-text_2x-sq.png',
        color: '#5698ae',
        title: record.name,
        text: cover['text'] || '',
        title_link: url,
        image_url: image_url,
      }
    end
  end
end
