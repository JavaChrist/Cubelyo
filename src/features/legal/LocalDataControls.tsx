"use client";
import { useState, useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { Modal } from "../game/Modal";
import { CLOUD_ENABLED } from "../cloud/config";
import { eraseSaveData, exportHasData, exportSaveData } from "../cloud/data";
import { eraseFailureMessage } from "../cloud/erase";
const subscribe = () => () => {};
export function LocalDataControls() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function exportData() {
    setBusy(true);
    setStatus("Préparation de l’export…");
    try {
      const data = await exportSaveData();
      if (!exportHasData(data)) {
        setStatus("Aucune sauvegarde Cubelyo sur cet appareil.");
        return;
      }
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory, Encoding } =
          await import("@capacitor/filesystem");
        const { Share } = await import("@capacitor/share");
        const file = await Filesystem.writeFile({
          path: "cubelyo-sauvegarde.json",
          directory: Directory.Cache,
          data: JSON.stringify(data, null, 2),
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: "Sauvegarde Cubelyo",
          url: file.uri,
          dialogTitle: "Enregistrer ma sauvegarde",
        });
        setStatus("Export préparé. Choisissez où conserver votre sauvegarde.");
        return;
      }
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "cubelyo-sauvegarde.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Export téléchargé. Conservez ce fichier sur votre appareil.");
    } catch {
      setStatus(
        "Export impossible. La copie locale est conservée. Vérifiez la connexion et réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function erase() {
    setBusy(true);
    setStatus("Effacement en cours…");
    try {
      await eraseSaveData();
      router.replace("/");
      router.refresh();
    } catch (error) {
      setConfirm(false);
      setStatus(eraseFailureMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="legal-data-actions" aria-labelledby="local-data-title">
      <h2 id="local-data-title">Ma sauvegarde sur cet appareil</h2>
      <p>
        Exportez votre progression ou effacez-la.{" "}
        {CLOUD_ENABLED
          ? "L’export comprend votre réponse sur l’âge, le compteur des promotions, la sauvegarde en ligne de cette identité anonyme et vos jetons d’achat Google Play ; il n’interrompt pas la synchronisation. Gardez le fichier pour vous. L’effacement supprime la sauvegarde en ligne et l’identité anonyme."
          : "L’export comprend votre réponse sur l’âge et le compteur des promotions. Aucun compte distant n’est associé à cette sauvegarde."}
      </p>
      <div>
        <button disabled={busy || !hydrated} onClick={exportData}>
          <Download size={18} aria-hidden="true" />
          Exporter ma sauvegarde
        </button>
        <button disabled={busy || !hydrated} onClick={() => setConfirm(true)}>
          <Trash2 size={18} aria-hidden="true" />
          Effacer ma sauvegarde
        </button>
      </div>
      <p role="status">{status}</p>
      {confirm && (
        <Modal
          title="Effacer la sauvegarde ?"
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
        >
          <p>
            Cette action efface sur cet appareil votre progression, vos pièces
            et atouts (achetés ou gagnés), vos réglages et votre réponse sur
            l’âge. Les pièces et packs achetés ne pourront pas être restaurés ;
            l’option sans publicité est conservée.{" "}
            {CLOUD_ENABLED &&
              "La sauvegarde en ligne et l’identité anonyme associées seront aussi supprimées. Une connexion est nécessaire. La sauvegarde en ligne restera désactivée jusqu’à votre réactivation dans les réglages."}{" "}
            Elle est irréversible. L’historique de commandes Google Play et les
            fichiers exportés ne sont pas touchés.
          </p>
          <div className="modal-actions">
            <button disabled={busy} onClick={() => setConfirm(false)}>
              Annuler
            </button>
            <button className="primary" disabled={busy} onClick={erase}>
              Confirmer l’effacement
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
