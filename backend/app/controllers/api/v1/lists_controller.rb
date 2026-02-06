module Api
  module V1
    class ListsController < ApplicationController
      skip_before_action :authenticate_request, only: [:index, :show]
      before_action :set_list, only: [:show, :update, :destroy]
      before_action :authorize_list_owner, only: [:update, :destroy]
      
      # GET /api/v1/lists
      # Returns public lists if not authenticated, or user's own lists + public lists if authenticated
      def index
        if current_user
          # Show user's own lists (all visibility) + other users' public lists
          @lists = List.where(user_id: current_user.id)
                       .or(List.where(visibility: 'public'))
                       .includes(:user, :items)
                       .order(created_at: :desc)
        else
          # Only show public lists if not authenticated
          @lists = List.where(visibility: 'public')
                       .includes(:user, :items)
                       .order(created_at: :desc)
        end
        
        render json: @lists, include: [:user, :items]
      end
      
      # GET /api/v1/lists/:id
      # Allow viewing if list is public OR user owns it
      def show
        if @list.visibility == 'private' && (!current_user || @list.user_id != current_user.id)
          render json: { error: 'Not authorized to view this list' }, status: :forbidden
          return
        end
        
        render json: @list, include: [:user, :items]
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
      
      private
      
      def set_list
        @list = List.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'List not found' }, status: :not_found
      end
      
      def authorize_list_owner
        unless @list.user_id == current_user.id
          render json: { error: 'Not authorized to modify this list' }, status: :forbidden
        end
      end
      
      def list_params
        params.require(:list).permit(:title, :description, :visibility)
      end
    end
  end
end
