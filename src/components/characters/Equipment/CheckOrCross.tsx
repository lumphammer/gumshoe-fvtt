import { FaCheck, FaTimes } from "react-icons/fa";
import { getTranslated } from "../../../functions/getTranslated";

interface CheckOrCrossProps {
  checked: boolean;
}

export const CheckOrCross = ({ checked }: CheckOrCrossProps) => {
  return checked ? (
    <FaCheck role="img" aria-hidden={false} aria-label={getTranslated("Yes")} />
  ) : (
    <FaTimes role="img" aria-hidden={false} aria-label={getTranslated("No")} />
  );
};

CheckOrCross.displayName = "CheckOrCross";
