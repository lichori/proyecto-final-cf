variable "tipo_instancia" {
  type    = string
  default = "t2.micro"

}

variable "aws_access_key" {
  description = "The AWS access key"
  type        = string
}

variable "aws_secret_key" {
  description = "The AWS secret key"
  type        = string
}

locals {
  common_tags = {
    Name        = "server-todo-list"
    Environment = "Prod"
    Owner       = "Lisandro-Vazquez"
  }
}

variable "region" {
  type    = string
  default = "us-west-2"
}