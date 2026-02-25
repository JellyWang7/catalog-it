module Api
  module V1
    class ItemLikesController < ApplicationController
      skip_before_action :authenticate_request
      before_action :authenticate_request_required
      before_action :set_item
      before_action :authorize_likeable_list

      # POST /api/v1/items/:id/like
      def create
        ItemLike.find_or_create_by!(item: @item, user: current_user)
        render_like_state
      end

      # DELETE /api/v1/items/:id/like
      def destroy
        ItemLike.where(item: @item, user: current_user).delete_all
        render_like_state
      end

      private

      def set_item
        @item = Item.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Item not found' }, status: :not_found
      end

      def authorize_likeable_list
        return if @item.list.visibility.in?(%w[public shared])

        render json: { error: 'Likes are only enabled for public and shared list items' }, status: :forbidden
      end

      def render_like_state
        render json: {
          item_id: @item.id,
          likes_count: @item.likes_count,
          liked_by_current_user: @item.liked_by?(current_user)
        }, status: :ok
      end
    end
  end
end
