variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used in resource naming."
  type        = string
  default     = "catalogit"
}

variable "environment" {
  description = "Deployment environment label."
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner tag value."
  type        = string
  default     = "jelly1"
}

variable "ec2_instance_type" {
  description = "EC2 instance class. Keep micro for low cost."
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_pair_name" {
  description = "Optional EC2 key pair name for SSH access."
  type        = string
  default     = null
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH into EC2 (restrict to your IP)."
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_instance_class" {
  description = "RDS instance class. Keep micro for low cost."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Primary PostgreSQL database name."
  type        = string
  default     = "catalogit_production"
}

variable "db_username" {
  description = "RDS master username."
  type        = string
  default     = "catalogit"
}

variable "db_password" {
  description = "RDS master password."
  type        = string
  sensitive   = true
}

variable "api_port" {
  description = "Backend API port exposed on EC2."
  type        = number
  default     = 80
}

variable "enable_schedules" {
  description = "Enable automatic daily start/stop schedules."
  type        = bool
  default     = true
}

variable "schedule_timezone" {
  description = "IANA timezone for scheduler windows."
  type        = string
  default     = "America/New_York"
}

variable "daily_start_cron" {
  description = "EventBridge cron expression for daily start."
  type        = string
  default     = "cron(0 18 * * ? *)"
}

variable "daily_stop_cron" {
  description = "EventBridge cron expression for daily stop."
  type        = string
  default     = "cron(0 20 * * ? *)"
}

variable "budget_limit_usd" {
  description = "Monthly AWS budget amount in USD."
  type        = number
  default     = 5
}

variable "budget_alert_email" {
  description = "Email for budget alerts. Leave blank to disable notifications."
  type        = string
  default     = ""
}

variable "cloudfront_api_origin_domain" {
  description = "Hostname CloudFront uses to reach the Rails API (EC2). Leave empty to use aws_instance.backend.public_dns (requires instance running at apply time). Set explicitly if using Elastic IP DNS, e.g. ec2-52-22-20-36.compute-1.amazonaws.com"
  type        = string
  default     = ""
}
