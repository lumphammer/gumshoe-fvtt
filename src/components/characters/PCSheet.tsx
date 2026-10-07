import { useIsDocumentLimited } from "../../hooks/useIsDocumentLimited";
import { PCSheetFull } from "./PCSheetFull";
import { PCSheetSimple } from "./PCSheetSimple";

export const PCSheet = () => {
  const isLimited = useIsDocumentLimited();
  return isLimited ? <PCSheetSimple /> : <PCSheetFull />;
};

PCSheet.displayName = "PCSheet";
