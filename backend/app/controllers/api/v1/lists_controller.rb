module Api
  module V1
    class ListsController < ApplicationController
      before_action :set_list, only: [:show, :update, :destroy]
      
      # GET /api/v1/lists
      def index
        @lists = List.public_lists.includes(:user, :items)
        render json: @lists, include: [:user, :items]
      end
      
      # GET /api/v1/lists/:id
      def show
        render json: @list, include: [:user, :items]
      end
      
      # POST /api/v1/lists
      def create
        @list = List.new(list_params)
        @list.user = current_user if respond_to?(:current_user)
        
        if @list.save
          render json: @list, status: :created
        else
          render json: @list.errors, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/lists/:id
      def update
        if @list.update(list_params)
          render json: @list
        else
          render json: @list.errors, status: :unprocessable_entity
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
      end
      
      def list_params
        params.require(:list).permit(:title, :description, :visibility, :user_id)
      end
    end
  end
end
