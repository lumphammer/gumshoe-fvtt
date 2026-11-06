type InputGridProps = {
  children: any;
  className?: string;
};

/** The grid's layout, for an element that's also something else (a panel). */
export const inputGridStyle = {
  display: "grid",
  gridTemplateRows: "auto",
  gridTemplateColumns: "[label] fit-content(50%) [control] 1fr [end]",
  gridAutoRows: "auto",
  rowGap: "0.2em",
} as const;

export const InputGrid = ({ children, className }: InputGridProps) => {
  return (
    <div css={inputGridStyle} className={className}>
      {children}
    </div>
  );
};
