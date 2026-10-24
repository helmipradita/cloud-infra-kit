# Keys Directory

Store your local private keys and OCI authentication config in this directory.

> ⚠️ **SECURITY NOTE:** All private key files in this directory are git-ignored. Never commit keys to version control!

## Required Files
* `oci_config`: OCI CLI/SDK configuration profile (copy from `oci_config.example`).
* `oci_api_key.pem`: Your private RSA key generated from OCI Console.
* `id_ed25519_oracle`: Private SSH key for server access and Ansible.
* `id_ed25519_oracle.pub`: Public SSH key injected into the VM by Terraform.

## Permissions Setup
```bash
chmod 700 keys
chmod 600 keys/oci_api_key.pem keys/oci_config keys/id_ed25519_oracle
chmod 644 keys/id_ed25519_oracle.pub
```
