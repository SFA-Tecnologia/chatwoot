class Public::Api::V1::ConversationsController < PublicController

  def fetch_by_protocolo
    protocolo = params[:protocolo]
    @conversation = Conversation.where("TRIM(additional_attributes->>'protocolo') = ?", protocolo).order(:created_at).reverse_order.first

    if @conversation.nil?
      render json: { error: 'Conversation not found for the given protocolo' }, status: :not_found
    else
      @messages = @conversation.messages.outgoing.where(private: false).order(:created_at).reverse_order.first
      render json: { conversation: @conversation, messages: @messages  }
    end
  end

end
