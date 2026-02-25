module Api
  module V1
    class ListLikesController < ApplicationController
      skip_before_action :authenticate_request
      before_action :authenticate_request_required
      before_action :set_list
      before_action :authorize_likeable_list
      before_action :authorize_non_owner_reactor

      # POST /api/v1/lists/:id/like
      def create
        ListLike.find_or_create_by!(list: @list, user: current_user)
        render_like_state
      end

      # DELETE /api/v1/lists/:id/like
      def destroy
        ListLike.where(list: @list, user: current_user).delete_all
        render_like_state
      end

      private

      def set_list
        @list = List.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'List not found' }, status: :not_found
      end

      def authorize_likeable_list
        return if @list.visibility.in?(%w[public shared])

        render json: { error: 'Likes are only enabled for public and shared lists' }, status: :forbidden
      end

      def authorize_non_owner_reactor
        return unless @list.user_id == current_user.id

        render json: { error: 'List owners cannot like their own lists' }, status: :forbidden
      end

      def render_like_state
        render json: {
          list_id: @list.id,
          likes_count: @list.likes_count,
          liked_by_current_user: @list.liked_by?(current_user)
        }, status: :ok
      end
    end
  end
end
