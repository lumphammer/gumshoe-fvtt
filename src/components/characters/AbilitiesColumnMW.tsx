import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { AbilitySlugPlayMw } from "./AbilitySlugPlayMw";
import { NoAbilitiesNote } from "./NoAbilitiesNote";

interface AbilitiesColumnMWProps {
  abilities: InvestigatorItem[];
}

export const AbilitiesColumnMW = ({ abilities }: AbilitiesColumnMWProps) => {
  return (
    <div
      css={{
        display: "grid",
        gridTemplateColumns: "1fr max-content max-content max-content",
        gridTemplateAreas: "'ability rating set spend'",
        gridAutoRows: "min-content",
        columnGap: "0.2em",
        rowGap: "0.4em",
        alignItems: "center",
        gridColumn: "auto",
      }}
    >
      {abilities.map((ability) => (
        <AbilitySlugPlayMw key={ability.id} ability={ability} />
      ))}
      {abilities.length === 0 && <NoAbilitiesNote />}
    </div>
  );
};
