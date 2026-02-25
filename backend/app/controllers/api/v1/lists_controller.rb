module Api
  module V1
    class ListsController < ApplicationController
      skip_before_action :authenticate_request
      before_action :authenticate_request_optional, only: [:index, :show, :shared]
      before_action :authenticate_request_required, only: [:create, :update, :destroy, :share]
      before_action :set_list, only: [:show, :update, :destroy, :share]
      before_action :authorize_list_owner, only: [:update, :destroy, :share]
      
      # GET /api/v1/lists
      # Returns public lists if not authenticated, or user's own lists + public lists if authenticated
      def index
        if current_user
          # Show user's own lists (all visibility) + other users' public lists
          @lists = List.where(user_id: current_user.id)
                       .or(List.where(visibility: 'public'))
                       .includes(:user, :items, :list_likes)
                       .order(created_at: :desc)
        else
          # Only show public lists if not authenticated
          @lists = List.where(visibility: 'public')
                       .includes(:user, :items, :list_likes)
                       .order(created_at: :desc)
        end
        
        render json: @lists.map { |list| serialize_list(list, include_comments: false) }
      end
      
      # GET /api/v1/lists/:id
      # Allow viewing if list is public OR user owns it
      def show
        if @list.visibility == 'private' && (!current_user || @list.user_id != current_user.id)
          render json: { error: 'Not authorized to view this list' }, status: :forbidden
          return
        end
        
        render json: serialize_list(@list)
      end
      
      # POST /api/v1/lists
      def create
        unless current_user
          render json: { error: 'Unauthorized' }, status: :unauthorized
          return
        end
        
        @list = current_user.lists.build(list_params)
        
        if @list.save
          render json: @list, status: :created
        else
          render json: { errors: @list.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/lists/:id
      def update
        if @list.update(list_params)
          render json: @list
        else
          render json: { errors: @list.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/lists/:id
      def destroy
        @list.destroy
        head :no_content
      end

      # POST /api/v1/lists/:id/share
      # Generate a share code for the list
      def share
        code = @list.share_code || @list.generate_share_code!
        render json: {
          share_code: code,
          share_url: "/s/#{code}"
        }, status: :ok
      end

      # GET /api/v1/lists/shared/:share_code
      # Look up a list by its share code (public access)
      def shared
        @list = List.find_by(share_code: params[:share_code])

        if @list.nil?
          render json: { error: 'Shared list not found' }, status: :not_found
          return
        end

        render json: serialize_list(@list)
      end
      
      private
      
      def set_list
        @list = List.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'List not found' }, status: :not_found
      end
      
      def authorize_list_owner
        unless current_user
          render json: { error: 'Unauthorized' }, status: :unauthorized
          return
        end
        
        unless @list.user_id == current_user.id
          render json: { error: 'Not authorized to modify this list' }, status: :forbidden
        end
      end
      
      def list_params
        params.require(:list).permit(:title, :description, :visibility)
      end

      def serialize_list(list, include_comments: true)
        {
          id: list.id,
          title: list.title,
          description: list.description,
          visibility: list.visibility,
          share_code: list.share_code,
          user_id: list.user_id,
          created_at: list.created_at,
          updated_at: list.updated_at,
          likes_count: list.likes_count,
          liked_by_current_user: list.liked_by?(current_user),
          user: {
            id: list.user.id,
            username: list.user.username,
            email: list.user.email
          },
          items: list.items.order(created_at: :desc).map { |item| serialize_item(item) },
          comments: include_comments ? list.comments.includes(:user).order(created_at: :desc).map { |comment| serialize_comment(comment) } : []
        }
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
          liked_by_current_user: item.liked_by?(current_user)
        }
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
