module Api
  module V1
    class CommentsController < ApplicationController
      skip_before_action :authenticate_request
      before_action :authenticate_request_optional, only: [:index]
      before_action :authenticate_request_required, only: [:create, :destroy]
      before_action :set_list, only: [:index, :create]
      before_action :set_comment, only: [:destroy]
      before_action :authorize_commentable_list, only: [:index, :create]
      before_action :authorize_comment_owner_or_list_owner, only: [:destroy]

      # GET /api/v1/lists/:list_id/comments
      def index
        comments = @list.comments.includes(:user).order(created_at: :desc)
        render json: comments.map { |comment| serialize_comment(comment) }
      end

      # POST /api/v1/lists/:list_id/comments
      def create
        comment = @list.comments.build(comment_params)
        comment.user = current_user

        if comment.save
          render json: serialize_comment(comment), status: :created
        else
          render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/comments/:id
      def destroy
        @comment.destroy
        head :no_content
      end

      private

      def set_list
        @list = List.find(params[:list_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'List not found' }, status: :not_found
      end

      def set_comment
        @comment = Comment.includes(:list).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Comment not found' }, status: :not_found
      end

      def authorize_commentable_list
        return if @list.visibility.in?(%w[public shared])

        render json: { error: 'Comments are only enabled for public and shared lists' }, status: :forbidden
      end

      def authorize_comment_owner_or_list_owner
        return if @comment.user_id == current_user.id || @comment.list.user_id == current_user.id

        render json: { error: 'Not authorized to delete this comment' }, status: :forbidden
      end

      def comment_params
        params.require(:comment).permit(:body)
      end

      def serialize_comment(comment)
        {
          id: comment.id,
          body: comment.body,
          user_id: comment.user_id,
          list_id: comment.list_id,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user: {
            id: comment.user.id,
            username: comment.user.username
          }
        }
      end
    end
  end
end
