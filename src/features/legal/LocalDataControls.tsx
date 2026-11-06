"use client";
import { useState, useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { Modal } from "../game/Modal";
import { CLOUD_ENABLED } from "../cloud/config";
import { eraseSaveData, exportSaveData } from "../cloud/data";
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
      if (!data.profile && !data.cloud) {
        setStatus("Aucune sauvegarde Cubelyo dans ce navigateur.");
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
    } catch {
      setConfirm(false);
      setStatus(
        "Effacement non terminé. La copie locale est conservée ; la synchronisation reste suspendue. Réessayez ou contactez support@javachrist.fr.",
      );
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
          ? "Si Firebase est activé, l’export comprend aussi la sauvegarde distante de cette identité anonyme ; l’effacement supprime cette sauvegarde et cette identité."
          : "Aucun compte distant n’est associé à cette sauvegarde."}
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
            Cette action efface votre progression, vos récompenses et vos
            réglages Cubelyo dans ce navigateur.{" "}
            {CLOUD_ENABLED &&
              "La sauvegarde Firebase et l’identité anonyme associées seront aussi supprimées. Une connexion est nécessaire. La sauvegarde en ligne restera désactivée jusqu’à votre réactivation dans les réglages."}{" "}
            Elle est irréversible. Les fichiers exportés restent sur votre
            appareil.
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
