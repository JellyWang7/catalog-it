module Api
  module V1
    class AttachmentsController < ApplicationController
      skip_before_action :authenticate_request
      before_action :authenticate_request_optional, only: [:index]
      before_action :authenticate_request_required, only: [:create, :destroy]
      before_action :set_attachable, only: [:index, :create]
      before_action :set_attachment, only: [:destroy]
      before_action :authorize_read_access!, only: [:index]
      before_action :authorize_owner_access!, only: [:create]
      before_action :authorize_delete_access!, only: [:destroy]

      # GET /api/v1/lists/:list_id/attachments
      # GET /api/v1/items/:item_id/attachments
      def index
        attachments = @attachable.attachments.order(created_at: :desc)
        render json: attachments.map { |attachment| serialize_attachment(attachment) }
      end

      # POST /api/v1/lists/:list_id/attachments
      # POST /api/v1/items/:item_id/attachments
      def create
        attachment = @attachable.attachments.build(attachment_params)
        attachment.user = current_user

        if attachment.save
          render json: serialize_attachment(attachment), status: :created
        else
          render json: { errors: attachment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/attachments/:id
      def destroy
        @attachment.destroy
        head :no_content
      end

      private

      def set_attachable
        if params[:list_id]
          @attachable = List.find(params[:list_id])
        elsif params[:item_id]
          @attachable = Item.find(params[:item_id])
        else
          render json: { error: 'Attachable not found' }, status: :not_found
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Attachable not found' }, status: :not_found
      end

      def set_attachment
        @attachment = Attachment.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Attachment not found' }, status: :not_found
      end

      def attachable_list
        @attachable.is_a?(List) ? @attachable : @attachable.list
      end

      def authorize_read_access!
        list = attachable_list
        return unless list.visibility == 'private' && (!current_user || list.user_id != current_user.id)

        render json: { error: 'Not authorized to view attachments in this list' }, status: :forbidden
      end

      def authorize_owner_access!
        list = attachable_list
        return if list.user_id == current_user.id

        render json: { error: 'Not authorized to modify attachments in this list' }, status: :forbidden
      end

      def authorize_delete_access!
        list = @attachment.attachable.is_a?(List) ? @attachment.attachable : @attachment.attachable.list
        return if list.user_id == current_user.id

        render json: { error: 'Not authorized to delete this attachment' }, status: :forbidden
      end

      def attachment_params
        params.require(:attachment).permit(:kind, :title, :body, :url, :asset)
      end

      def serialize_attachment(attachment)
        {
          id: attachment.id,
          kind: attachment.kind,
          title: attachment.title,
          body: attachment.body,
          url: attachment.link? ? attachment.url : attachment_url(attachment),
          mime_type: attachment.mime_type,
          size_bytes: attachment.size_bytes,
          attachable_type: attachment.attachable_type,
          attachable_id: attachment.attachable_id,
          user_id: attachment.user_id,
          created_at: attachment.created_at,
          updated_at: attachment.updated_at
        }
      end

      def attachment_url(attachment)
        return nil if attachment.note?
        return nil unless attachment.asset.attached?

        rails_blob_url(attachment.asset, host: request.base_url)
      end
    end
  end
end
