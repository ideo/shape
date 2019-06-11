module TestDoubles
  def network_mailing_list_doubles(
    mailing_list: default_network_mailing_list_double,
    mailing_list_membership: default_network_mailing_list_membership_double
  )
    allow_any_instance_of(Organization).to receive(:network_organization).and_return(
      double('NetworkApi::Organization', id: 'network-org-123'),
    )
    allow(NetworkApi::MailingList).to receive(:where).and_return([mailing_list])
    allow(NetworkApi::MailingListMembership).to receive(:create).and_return(mailing_list_membership)
    allow(NetworkApi::MailingListMembership).to receive(:where).and_return([mailing_list_membership])
  end

  def default_network_mailing_list_double
    double('NetworkApi::MailingList', id: 'list-123')
  end

  def default_network_mailing_list_membership_double
    double('NetworkApi::MailingList', id: 'membership-123')
  end
end
