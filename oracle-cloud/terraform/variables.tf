variable "tenancy_ocid" {
  type        = string
  description = "OCI Tenancy OCID"
}

variable "user_ocid" {
  type        = string
  description = "OCI User OCID"
}

variable "compartment_ocid" {
  type        = string
  description = "OCI Compartment OCID"
}

variable "fingerprint" {
  type        = string
  description = "OCI API Key Fingerprint"
}

variable "private_key_path" {
  type        = string
  description = "Path to OCI API Key PEM file"
  default     = "../keys/oci_api_key.pem"
}

variable "region" {
  type        = string
  description = "OCI Region"
  default     = "ap-batam-1"
}

variable "ssh_public_key_path" {
  type        = string
  description = "Path to SSH public key for compute instance"
  default     = "../keys/id_ed25519_oracle.pub"
}

variable "instance_name" {
  type        = string
  description = "Display name for instance"
  default     = "instance-terraform"
}

variable "image_id" {
  type        = string
  description = "Ubuntu 24.04 aarch64 image OCID"
  default     = "ocid1.image.oc1.ap-batam-1.aaaaaaaaoim33bqupt5df6uiudy34rx75v5sfbsxu3ootl522bpik5q7h6tq"
}

locals {
  common_tags = {
    "ManagedBy"   = "Terraform"
    "Environment" = "Production"
    "Project"     = "oracle-free-tier-payg"
  }
}
