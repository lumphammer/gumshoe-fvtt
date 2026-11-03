import { FaCheck, FaTimes } from "react-icons/fa";

interface CheckOrCrossProps {
  checked: boolean;
}

export const CheckOrCross = ({ checked }: CheckOrCrossProps) => {
  return checked ? <FaCheck /> : <FaTimes />;
};

CheckOrCross.displayName = "CheckOrCross";
