module Api
  module V1
    class ItemsController < ApplicationController
      skip_before_action :authenticate_request
      before_action :authenticate_request_optional, only: [:index, :show]
      before_action :authenticate_request_required, only: [:create, :update, :destroy]
      before_action :set_list, only: [:index, :create]
      before_action :set_item, only: [:show, :update, :destroy]
      before_action :authorize_list_access, only: [:index, :show]
      before_action :authorize_list_owner, only: [:create, :update, :destroy]
      
      # GET /api/v1/lists/:list_id/items
      def index
        @items = @list.items.order(created_at: :desc)
        render json: @items.map { |item| serialize_item(item) }
      end
      
      # GET /api/v1/items/:id
      def show
        render json: serialize_item(@item)
      end
      
      # POST /api/v1/lists/:list_id/items
      def create
        @item = @list.items.build(item_params)
        
        if @item.save
          render json: serialize_item(@item), status: :created
        else
          render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/items/:id
      def update
        if @item.update(item_params)
          render json: serialize_item(@item)
        else
          render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/items/:id
      def destroy
        @item.destroy
        head :no_content
      end
      
      private
      
      def set_list
        @list = List.find(params[:list_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'List not found' }, status: :not_found
      end
      
      def set_item
        @item = Item.find(params[:id])
        @list = @item.list
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Item not found' }, status: :not_found
      end
      
      # Check if user can view items (public list OR user owns it)
      def authorize_list_access
        if @list.visibility == 'private' && (!current_user || @list.user_id != current_user.id)
          render json: { error: 'Not authorized to view items in this list' }, status: :forbidden
        end
      end
      
      # Check if user owns the list (for create/update/delete)
      def authorize_list_owner
        unless current_user
          render json: { error: 'Authentication required' }, status: :unauthorized
          return
        end
        
        unless @list.user_id == current_user.id
          render json: { error: 'Not authorized to modify items in this list' }, status: :forbidden
        end
      end
      
      def item_params
        params.require(:item).permit(:name, :category, :notes, :rating)
      end

      def serialize_item(item)
        {
          id: item.id,
          name: item.name,
          category: item.category,
          notes: item.notes,
          rating: item.rating,
          list_id: item.list_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          likes_count: item.likes_count,
          liked_by_current_user: item.liked_by?(current_user),
          attachments: item.attachments.order(created_at: :desc).map { |attachment| serialize_attachment(attachment) }
        }
      end

      def serialize_attachment(attachment)
        {
          id: attachment.id,
          kind: attachment.kind,
          title: attachment.title,
          body: attachment.body,
          url: if attachment.link?
                 attachment.url
               elsif attachment.note?
                 nil
               elsif attachment.asset.attached?
                 rails_blob_url_for_attachment(attachment.asset)
               else
                 nil
               end,
          mime_type: attachment.mime_type,
          size_bytes: attachment.size_bytes,
          created_at: attachment.created_at,
          updated_at: attachment.updated_at
        }
      end
    end
  end
end
