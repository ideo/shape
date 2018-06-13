require 'google/cloud/firestore'

class FirestoreClient
  attr_reader :client

  def initialize
    @client = Google::Cloud::Firestore.new
  end

  def read(path)
    @client.doc(path)
  end

  def write(path, data)
    @client.transaction do |tx|
      tx.set(path, data)
    end
  end

  def self.client
    @client ||= new.client
  end
end
