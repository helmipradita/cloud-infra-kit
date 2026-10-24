#!/usr/bin/env node
import * as common from "oci-common";
import * as core from "oci-core";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OCI_CONFIG_PATH = path.join(REPO_ROOT, "keys", "oci_config");
const OCI_PEM_PATH = path.join(REPO_ROOT, "keys", "oci_api_key.pem");

function getClient(): { client: core.VirtualNetworkClient; compartmentId: string } {
  if (!fs.existsSync(OCI_CONFIG_PATH) || !fs.existsSync(OCI_PEM_PATH)) {
    console.error(`[ERR] File kredensial OCI tidak ditemukan di keys/`);
    console.error(`Pastikan keys/oci_config dan keys/oci_api_key.pem sudah tersedia.`);
    console.error(`Lihat panduan di keys/README.md atau keys/oci_config.example.`);
    process.exit(1);
  }

  const iniText = fs.readFileSync(OCI_CONFIG_PATH, "utf-8");
  const userMatch = iniText.match(/user\s*=\s*(.*)/);
  const fpMatch = iniText.match(/fingerprint\s*=\s*(.*)/);
  const tenancyMatch = iniText.match(/tenancy\s*=\s*(.*)/);
  const regionMatch = iniText.match(/region\s*=\s*(.*)/);

  if (!userMatch || !fpMatch || !tenancyMatch || !regionMatch) {
    console.error("[ERR] Format keys/oci_config tidak valid. Butuh user, fingerprint, tenancy, region.");
    process.exit(1);
  }

  const user = userMatch[1].trim();
  const fingerprint = fpMatch[1].trim();
  const tenancy = tenancyMatch[1].trim();
  const region = regionMatch[1].trim();
  const pemContent = fs.readFileSync(OCI_PEM_PATH, "utf-8");

  const provider = new common.SimpleAuthenticationDetailsProvider(
    tenancy,
    user,
    fingerprint,
    pemContent,
    null,
    common.Region.fromRegionId(region)
  );

  const client = new core.VirtualNetworkClient({ authenticationDetailsProvider: provider });
  return { client, compartmentId: tenancy };
}

async function listIps() {
  const { client, compartmentId } = getClient();
  const res = await client.listPublicIps({
    scope: core.requests.ListPublicIpsRequest.Scope.Region,
    compartmentId
  });

  const ips = res.items || [];
  console.log(`\n============================================================`);
  console.log(`[INFO] Total Reserved Public IPs di Akun: ${ips.length}`);
  console.log(`============================================================`);
  for (const ip of ips) {
    const status = ip.assignedEntityType ? `ATTACHED ke ${ip.assignedEntityType}` : "UNATTACHED (Tersedia)";
    console.log(` • Nama     : ${ip.displayName}`);
    console.log(`   IP       : ${ip.ipAddress}`);
    console.log(`   Status   : ${status}`);
    console.log(`   OCID     : ${ip.id}`);
    console.log(`------------------------------------------------------------`);
  }
  return ips;
}

async function createIp() {
  const { client, compartmentId } = getClient();
  const ips = await client.listPublicIps({
    scope: core.requests.ListPublicIpsRequest.Scope.Region,
    compartmentId
  });

  const existing = (ips.items || []).find(ip => ip.displayName === "reserved-ip-terraform");
  if (existing) {
    console.log(`\n[EXISTING] IP 'reserved-ip-terraform' sudah ada:`);
    console.log(` • IP   : ${existing.ipAddress}`);
    console.log(` • OCID : ${existing.id}`);
    return existing;
  }

  console.log("\n[INFO] Mengajukan Reserved Public IP baru dengan nama 'reserved-ip-terraform'...");
  const res = await client.createPublicIp({
    createPublicIpDetails: {
      compartmentId,
      displayName: "reserved-ip-terraform",
      lifetime: core.models.CreatePublicIpDetails.Lifetime.Reserved
    }
  });

  console.log(`\n[CREATED] Berhasil terbit IP baru:`);
  console.log(` • IP   : ${res.publicIp.ipAddress}`);
  console.log(` • OCID : ${res.publicIp.id}`);
  return res.publicIp;
}

async function deleteIp() {
  const { client, compartmentId } = getClient();
  const ips = await client.listPublicIps({
    scope: core.requests.ListPublicIpsRequest.Scope.Region,
    compartmentId
  });

  const target = (ips.items || []).find(ip => ip.displayName === "reserved-ip-terraform");
  if (!target || !target.id) {
    console.log("\n[WARN] Tidak ditemukan Reserved IP dengan nama 'reserved-ip-terraform' untuk dihapus.");
    return;
  }

  if (target.assignedEntityType) {
    console.error(`\n[ERR] IP ${target.ipAddress} sedang aktif terpasang ke ${target.assignedEntityType}.`);
    console.error("Dilarang menghapus IP yang sedang berjalan!");
    process.exit(1);
  }

  console.log(`\n[INFO] Menghapus Reserved IP: ${target.ipAddress} (${target.id})...`);
  await client.deletePublicIp({ publicIpId: target.id });
  console.log(`[DELETED] Berhasil menghapus ${target.ipAddress}.`);
}

async function main() {
  const action = process.argv[2] || "list";

  try {
    if (action === "list") {
      await listIps();
    } else if (action === "create") {
      await createIp();
    } else if (action === "delete") {
      await deleteIp();
    } else {
      console.log("Penggunaan: npx tsx scripts/gacha-reserved-ip.ts [list|create|delete]");
    }
  } catch (err: any) {
    console.error("\n[FATAL ERROR]:", err.message || err);
    process.exit(1);
  }
}

main();
