output "public_ip" {
  description = "Reserved Public IP address"
  value       = oci_core_public_ip.reserved_ip.ip_address
}

output "instance_id" {
  description = "OCID of compute instance"
  value       = oci_core_instance.vm.id
}

output "private_ip" {
  description = "Private IP address of instance"
  value       = data.oci_core_private_ips.vm_private_ips.private_ips[0].ip_address
}
