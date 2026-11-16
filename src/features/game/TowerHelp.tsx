import { ArrowUp, Check, Gift } from "lucide-react";
import { ChestArt, TowerBalloon } from "./ProgressScreens";
export function TowerHelp({ onClose }: { onClose: () => void }) {
  return (
    <section className="tower-help">
      <ol>
        <li>
          <div className="tower-help-art victory-help">
            <Check size={35} />
          </div>
          <div>
            <h3>Terminez des niveaux</h3>
            <p>Chaque première victoire ajoute un étage à votre tour.</p>
          </div>
        </li>
        <li>
          <div className="tower-help-art balloon-help">
            <ArrowUp size={24} />
            <TowerBalloon small />
          </div>
          <div>
            <h3>Montez toujours plus haut</h3>
            <p>
              Votre montgolfière indique votre position. Chaque saison dure 14
              jours, puis la tour repart à zéro : vos niveaux restent acquis.
            </p>
          </div>
        </li>
        <li>
          <div className="tower-help-art chest-help">
            <ChestArt />
            <Gift size={22} />
          </div>
          <div>
            <h3>Ouvrez vos coffres</h3>
            <p>
              Un coffre surprise tous les cinq étages, de plus en plus riche en
              montant. Ouvrez-les avant la fin de la saison : les coffres non
              ouverts sont perdus.
            </p>
          </div>
        </li>
      </ol>
      <button className="primary" onClick={onClose}>
        Compris
      </button>
    </section>
  );
}
