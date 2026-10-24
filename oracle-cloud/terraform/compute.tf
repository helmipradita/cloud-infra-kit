data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}

resource "oci_core_instance" "vm" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  fault_domain        = "FAULT-DOMAIN-3"
  display_name        = var.instance_name
  shape               = "VM.Standard.A1.Flex"
  freeform_tags       = local.common_tags

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  source_details {
    source_type             = "image"
    source_id               = var.image_id
    boot_volume_size_in_gbs = 200
    boot_volume_vpus_per_gb = 10
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    display_name     = "vnic-terraform"
    assign_public_ip = false
    hostname_label   = "instance-terraform"
    freeform_tags    = local.common_tags
  }

  metadata = {
    ssh_authorized_keys = file(pathexpand(var.ssh_public_key_path))
  }
}

data "oci_core_vnic_attachments" "vm_vnics" {
  compartment_id = var.compartment_ocid
  instance_id    = oci_core_instance.vm.id
}

data "oci_core_private_ips" "vm_private_ips" {
  vnic_id = data.oci_core_vnic_attachments.vm_vnics.vnic_attachments[0].vnic_id
}

resource "oci_core_public_ip" "reserved_ip" {
  compartment_id = var.compartment_ocid
  display_name   = "reserved-ip-terraform"
  lifetime       = "RESERVED"
  private_ip_id  = data.oci_core_private_ips.vm_private_ips.private_ips[0].id
  freeform_tags  = local.common_tags
}
