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
        render json: @items
      end
      
      # GET /api/v1/items/:id
      def show
        render json: @item
      end
      
      # POST /api/v1/lists/:list_id/items
      def create
        @item = @list.items.build(item_params)
        
        if @item.save
          render json: @item, status: :created
        else
          render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/items/:id
      def update
        if @item.update(item_params)
          render json: @item
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
    end
  end
end
