class Api::V1::Accounts::ConversationsController < Api::V1::Accounts::BaseController
  include Events::Types
  include Sift
  include DateRangeHelper
  include HmacConcern

  before_action :conversation, except: [:index, :meta, :search, :create, :filter, :get_conversations_by_assignee, :download_xlsx, :download_pdf]
  before_action :inbox, :contact, :contact_inbox, only: [:create]

  sort_on :created_at, type: :datetime

  def index
    result = conversation_finder.perform
    @conversations = result[:conversations]
    @conversations_count = result[:count]
  end

  def get_assigned_agent_name(user_ids)
    return nil if user_ids.blank?

    # Assuming user_ids is an array of IDs
    users = User.where(id: user_ids)

    # Combine the names of the users. Adjust according to your User model attributes.
    users.pluck(:name).join(', ')
  end

  def get_conversations_by_assignee

    base_query = Current.account.conversations.includes(:contact, :assignee)

    conversations = filtrate(base_query).filter_by_created_at(range)
                                        .filter_by_assigned_agent_id(params[:user_ids])
                                        .filter_by_inbox_id(params[:inbox_id])
                                        .order(:created_at).reverse_order

    conversations = conversations.page(params[:page] || 1).per(params[:per_page] || 25)

    if conversations.any?
      render json: {
        conversations: conversations.as_json(include: {
          contact: {
            only: [:id, :name, :email], # Adjust the fields as necessary
          },
          assignee: {
            only: [:id, :name, :email], # Adjust the fields as necessary
          }
        }),
        total_pages: conversations.total_pages,
        current_page: conversations.current_page,
        total_count: conversations.total_count
      }, status: :ok
    else
      render json: { message: 'No conversations available' }, status: :no_content
    end
  end

  def meta
    result = conversation_finder.perform
    @conversations_count = result[:count]
  end

  def search
    result = conversation_finder.perform
    @conversations = result[:conversations]
    @conversations_count = result[:count]
  end

  def attachments
    @attachments = @conversation.attachments
  end

  def show; end

  def create
    ActiveRecord::Base.transaction do
      @conversation = ConversationBuilder.new(params: params, contact_inbox: @contact_inbox).perform
      Messages::MessageBuilder.new(Current.user, @conversation, params[:message]).perform if params[:message].present?
    end
  end

  def filter
    result = ::Conversations::FilterService.new(params.permit!, current_user).perform
    @conversations = result[:conversations]
    @conversations_count = result[:count]
  end

  def mute
    @conversation.mute!
    head :ok
  end

  def unmute
    @conversation.unmute!
    head :ok
  end

  def can_be_updated_by
    conversation = Conversation.find(params[:id])
    can_update = conversation.can_be_updated_by?(Current.user&.id)

    render json: { can_be_updated_by: can_update }
  end

  def download_xlsx
    base_query = Current.account.conversations.includes(:contact, :assignee)

    @conversations = filtrate(base_query).filter_by_created_at(range)
                                         .filter_by_assigned_agent_id(params[:user_ids])
                                         .filter_by_inbox_id(params[:inbox_id])
                                         .order(:created_at).reverse_order

    # Assuming you have a method or a way to get the assigned agent's name
    @assigned_agent_name = get_assigned_agent_name(params[:user_ids])

    @total_conversations = @conversations.count

    # Passing the date range
    start_date = range.begin
    end_date = range.end - 1.day

    formatted_start_date = start_date.strftime('%d/%m/%Y')
    formatted_end_date = end_date.strftime('%d/%m/%Y')

    @date_range = "#{formatted_start_date} - #{formatted_end_date}"

    render xlsx: 'download_xlsx', template: '/api/v1/accounts/conversations/get_xlsx', filename: 'relatorio.xlsx', disposition: 'attachment'
  end

  def download_pdf
    base_query = Current.account.conversations.includes(:contact, :assignee)

    @conversations = filtrate(base_query).filter_by_created_at(range)
                                         .filter_by_assigned_agent_id(params[:user_ids])
                                         .filter_by_inbox_id(params[:inbox_id])
                                         .order(:created_at).reverse_order

    # Assuming you have a method or a way to get the assigned agent's name
    @assigned_agent_name = get_assigned_agent_name(params[:user_ids])

    @total_conversations = @conversations.count

    # Passing the date range
    start_date = range.begin
    end_date = range.end - 1.day

    formatted_start_date = start_date.strftime('%d/%m/%Y')
    formatted_end_date = end_date.strftime('%d/%m/%Y')

    @date_range = "#{formatted_start_date} - #{formatted_end_date}"

    render pdf: 'relatorio', template: 'api/v1/accounts/conversations/conversations', formats: [:html], orientation: "Landscape", disposition: 'attachment'
  end

  def transcript
    render json: { error: 'email param missing' }, status: :unprocessable_entity and return if params[:email].blank?

    ConversationReplyMailer.with(account: @conversation.account).conversation_transcript(@conversation, params[:email])&.deliver_later
    head :ok
  end

  def toggle_status
    if params[:status].present?
      set_conversation_status
      @status = @conversation.save!
    else
      @status = @conversation.toggle_status
    end
    assign_conversation if @conversation.status == 'open' && Current.user.is_a?(User) && Current.user&.agent?
  end

  def toggle_priority
    @conversation.toggle_priority(params[:priority])
    head :ok
  end

  def toggle_typing_status
    typing_status_manager = ::Conversations::TypingStatusManager.new(@conversation, current_user, params)
    typing_status_manager.toggle_typing_status
    head :ok
  end

  def update_last_seen
    update_last_seen_on_conversation(DateTime.now.utc, assignee?)
  end

  def unread
    last_incoming_message = @conversation.messages.incoming.last
    last_seen_at = last_incoming_message.created_at - 1.second if last_incoming_message.present?
    update_last_seen_on_conversation(last_seen_at, true)
  end

  def custom_attributes
    @conversation.custom_attributes = params.permit(custom_attributes: {})[:custom_attributes]
    @conversation.save!
  end

  private

  def update_last_seen_on_conversation(last_seen_at, update_assignee)
    # rubocop:disable Rails/SkipsModelValidations
    @conversation.update_column(:agent_last_seen_at, last_seen_at)
    @conversation.update_column(:assignee_last_seen_at, last_seen_at) if update_assignee.present?
    # rubocop:enable Rails/SkipsModelValidations
  end

  def set_conversation_status
    @conversation.status = params[:status]
    @conversation.snoozed_until = parse_date_time(params[:snoozed_until].to_s) if params[:snoozed_until]
  end

  def assign_conversation
    @agent = Current.account.users.find(current_user.id)
    @conversation.update_assignee(@agent)
  end

  def conversation
    @conversation ||= Current.account.conversations.find_by!(display_id: params[:id])
    authorize @conversation.inbox, :show?
  end

  def inbox
    return if params[:inbox_id].blank?

    @inbox = Current.account.inboxes.find(params[:inbox_id])
    authorize @inbox, :show?
  end

  def contact
    return if params[:contact_id].blank?

    @contact = Current.account.contacts.find(params[:contact_id])
  end

  def contact_inbox
    @contact_inbox = build_contact_inbox

    # fallback for the old case where we do look up only using source id
    # In future we need to change this and make sure we do look up on combination of inbox_id and source_id
    # and deprecate the support of passing only source_id as the param
    @contact_inbox ||= ::ContactInbox.find_by!(source_id: params[:source_id])
    authorize @contact_inbox.inbox, :show?
  rescue ActiveRecord::RecordNotUnique
    render json: { error: 'source_id should be unique' }, status: :unprocessable_entity
  end

  def build_contact_inbox
    return if @inbox.blank? || @contact.blank?

    ContactInboxBuilder.new(
      contact: @contact,
      inbox: @inbox,
      source_id: params[:source_id],
      hmac_verified: hmac_verified?
    ).perform
  end

  def conversation_finder
    @conversation_finder ||= ConversationFinder.new(Current.user, params)
  end

  def assignee?
    @conversation.assignee_id? && Current.user == @conversation.assignee
  end
end
