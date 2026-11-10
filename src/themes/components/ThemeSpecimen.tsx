import {
  type PropsWithChildren,
  type ReactNode,
  useMemo,
  useState,
} from "react";

import { Callout } from "../../components/Callout";
import { CSSReset } from "../../components/CSSReset";
import { LogoEditable } from "../../components/characters/LogoEditable";
import { Button } from "../../components/inputs/Button";
import { Checkbox } from "../../components/inputs/Checkbox";
import { Select } from "../../components/inputs/Select";
import { TextInput } from "../../components/inputs/TextInput";
import { Toggle } from "../../components/inputs/Toggle";
import { Panel } from "../../components/Panel";
import { DragHandle } from "../../components/sortableTable/DragHandle";
import { TabContainer } from "../../components/TabContainer";
import { css, cx } from "../../styled-system/css";
import {
  appFrame,
  badge,
  card,
  displayText,
  emptyState,
  floating,
  mutedText,
  outcome,
  partyCell,
  row,
  sectionHeading,
  surface,
  tableHeader,
} from "../../styled-system/recipes";
import { tones } from "../catalogue/tones";
import {
  paletteColorKeys,
  paletteStyle,
  paletteVar,
  themeSlug,
} from "../palette";
import type { Theme } from "../theme";

const buttonKinds = ["default", "cta", "toolbar", "ghost", "pip"] as const;
const floatingKinds = ["overlay", "drawer", "bar", "chip"] as const;

/** What a specimen is: the farm's label, not the theme's */
const Label = ({ children }: PropsWithChildren) => (
  <div
    className={css({
      font: "[11px monospace]",
      letterSpacing: "[0]",
      textTransform: "none",
      opacity: 0.6,
      marginTop: "[0.8em]",
      marginBottom: "[0.2em]",
    })}
  >
    {children}
  </div>
);

const Row = ({ children }: PropsWithChildren) => (
  <div
    className={css({
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "[0.4em]",
    })}
  >
    {children}
  </div>
);

const Swatch = ({ name }: { name: (typeof paletteColorKeys)[number] }) => (
  <div
    title={name}
    className={css({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "[4.2em]",
      font: "[10px monospace]",
      letterSpacing: "[0]",
      textTransform: "none",
      overflow: "hidden",
      textOverflow: "ellipsis",
    })}
  >
    <div
      className={css({
        width: "[2.4em]",
        height: "[2.4em]",
        borderRadius: "[50%]",
        border: "[1px solid rgba(128,128,128,0.5)]",
        // a checkerboard, so translucent colours show as translucent
        backgroundImage:
          "[conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)]",
        backgroundSize: "[0.8em 0.8em]",
      })}
    >
      <div
        className={css({
          width: "100%",
          height: "100%",
          borderRadius: "[50%]",
        })}
        style={{ background: `var(${paletteVar(name)})` }}
      />
    </div>
    {name}
  </div>
);

const Section = ({
  label,
  children,
}: PropsWithChildren<{ label: ReactNode }>) => (
  <>
    <Label>{label}</Label>
    {children}
  </>
);

type ThemeSpecimenProps = {
  id: string;
  theme: Theme;
  logoText: string;
  onChangeLogoText: (text: string) => void;
};

/**
 * One theme's column in the theme farm: the catalogue's recipes, mostly
 * through the components that use them, in the theme.
 */
export const ThemeSpecimen = ({
  id,
  theme,
  logoText,
  onChangeLogoText,
}: ThemeSpecimenProps) => {
  const [text, setText] = useState("Some text");
  const [checked, setChecked] = useState(true);
  const [toggled, setToggled] = useState(true);
  const [tab, setTab] = useState("one");
  const cardClasses = card();
  // what a window around a sheet gets from frame.ts: the frame's classes and
  // attribute, for the theme's appFrame overrides (some themes' wallpaper is
  // on the window), and the palette, without colorScheme
  const frameStyle = useMemo(() => {
    const { colorScheme: _, ...properties } = paletteStyle(theme.palette);
    return properties;
  }, [theme.palette]);

  return (
    <div
      data-inv-frame={themeSlug(theme)}
      data-inv-layout={theme.layout === "full-frame" ? "full-frame" : undefined}
      className={cx(
        appFrame({ layout: theme.layout }).root,
        css({
          width: "var(--farm-column-width)",
          flex: "none",
          position: "relative",
          // as a window would, so nothing spills into the next theme (clip,
          // not hidden, which would scroll on its own)
          overflow: "clip",
        }),
      )}
      style={frameStyle}
    >
      <CSSReset
        noStyleAppWindow
        mode="large"
        theme={theme}
        className={css({
          // a column, not a window
          height: "auto",
          minHeight: "100%",
          position: "relative",
        })}
      >
        <div
          className={css({
            font: "[12px monospace]",
            textTransform: "none",
            letterSpacing: "[0]",
            opacity: 0.7,
          })}
        >
          {id} · {theme.layout}
        </div>
        <div className={css({ position: "relative", height: "[6em]" })}>
          <LogoEditable
            mainText={logoText}
            subText="Subtext"
            onChangeMainText={onChangeLogoText}
            className={css({ width: "100%" })}
          />
        </div>

        <Section label="palette">
          <div
            className={css({
              display: "flex",
              flexWrap: "wrap",
              gap: "[0.3em]",
            })}
          >
            {paletteColorKeys.map((key) => (
              <Swatch key={key} name={key} />
            ))}
          </div>
        </Section>

        <Section label="panel › panel (nested)">
          <Panel>
            Body text in a panel. <a>A link</a>.
            <Panel className={css({ marginTop: "[0.5em]" })}>
              A nested panel
            </Panel>
          </Panel>
        </Section>

        <Section label="button kinds">
          <Row>
            {buttonKinds.map((kind) => (
              <Button
                key={kind}
                kind={kind}
                onClick={() => undefined}
                className={css({ width: "auto", flex: "none" })}
              >
                {kind === "pip" ? "+" : kind}
              </Button>
            ))}
            <Button
              disabled
              onClick={() => undefined}
              className={css({ width: "auto", flex: "none" })}
            >
              disabled
            </Button>
          </Row>
        </Section>

        <Section label="input · select · checkbox · toggle">
          <TextInput value={text} onChange={setText} />
          <Row>
            <Select defaultValue="b" className={css({ flex: "1" })}>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </Select>
            <Checkbox checked={checked} onChange={setChecked} />
            <Toggle checked={toggled} onChange={setToggled} label="toggle" />
          </Row>
          <TextInput value="" placeholder="placeholder" disabled />
        </Section>

        <Section label="tabs">
          <div className={css({ position: "relative", height: "[9em]" })}>
            <TabContainer
              defaultTab="one"
              selected={tab}
              onSelect={setTab}
              tabs={[
                {
                  id: "one",
                  label: "Abilities",
                  translate: false,
                  content: <div>The first tab&apos;s content</div>,
                },
                {
                  id: "two",
                  label: "Equipment",
                  translate: false,
                  content: <div>The second tab&apos;s content</div>,
                },
                {
                  id: "three",
                  label: "Notes",
                  translate: false,
                  content: <div>The third tab&apos;s content</div>,
                },
              ]}
            />
          </div>
        </Section>

        <Section label="card">
          <div className={cardClasses.root}>
            <p className={cardClasses.supertitle}>Supertitle · Category</p>
            <h2 className={cardClasses.title}>Card title</h2>
            <p className={cardClasses.subtitle}>Subtitle</p>
            <p className={cardClasses.description}>
              The card&apos;s description.
            </p>
            <p className={cardClasses.effect}>Its effect.</p>
          </div>
        </Section>

        <Section label="callout tones">
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "[0.3em]",
            })}
          >
            {tones.map((tone) => (
              <Callout key={tone} tone={tone}>
                {tone}
              </Callout>
            ))}
          </div>
        </Section>

        <Section label="badge: tone × subtle / strong">
          {(["subtle", "strong"] as const).map((weight) => (
            <Row key={weight}>
              {tones.map((tone) => (
                <span key={tone} className={badge({ tone, weight })}>
                  {tone}
                </span>
              ))}
            </Row>
          ))}
        </Section>

        <Section label="displayText sm / md / lg · mutedText sm / md · outcome">
          <Row>
            {(["sm", "md", "lg"] as const).map((size) => (
              <span key={size} className={displayText({ size })}>
                Display {size}
              </span>
            ))}
          </Row>
          <Row>
            {(["sm", "md"] as const).map((size) => (
              <span key={size} className={mutedText({ size })}>
                Muted {size}
              </span>
            ))}
          </Row>
          <Row>
            {tones.map((tone) => (
              <span key={tone} className={outcome({ tone })}>
                {tone}
              </span>
            ))}
          </Row>
        </Section>

        <Section label="sectionHeading · tableHeader · rows · dragHandle">
          <h3 className={sectionHeading()}>Section heading</h3>
          {/* as the weapons list has them: each row one element, its cells
            on the list's columns (subgrid) */}
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "[3em 1fr 4em]",
              "& > *": {
                gridColumn: "[1 / -1]",
                display: "grid",
                gridTemplateColumns: "subgrid",
                alignItems: "center",
              },
              "& > * > *": { padding: "[0.2em]" },
            })}
          >
            <div className={tableHeader()}>
              <div />
              <div>Name</div>
              <div>Ammo</div>
            </div>
            {[
              ["plain", row()],
              ["alternate", row({ alternate: true })],
              ["interactive", row({ interactive: true })],
              ["selected", row({ interactive: true })],
            ].map(([name, className]) => (
              <div
                key={name}
                className={className}
                data-selected={name === "selected" || undefined}
              >
                <DragHandle />
                <div>{name} row</div>
                <div>6</div>
              </div>
            ))}
          </div>
          {(["striped", "divided"] as const).map((variant) => (
            <div key={variant} className={css({ marginTop: "[0.4em]" })}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={cx(
                    row({ [variant]: true }),
                    css({ padding: "[0.2em]" }),
                  )}
                >
                  {variant} row {n}
                </div>
              ))}
            </div>
          ))}
        </Section>

        <Section label="emptyState">
          <div className={emptyState()}>Nothing here yet</div>
        </Section>

        <Section label="surface: depth × solid">
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "[1fr 1fr]",
              gap: "[0.3em]",
            })}
          >
            {(["top", "nested"] as const).flatMap((depth) =>
              [false, true].map((solid) => (
                <div
                  key={`${depth}${solid}`}
                  className={cx(
                    surface({ depth, solid }),
                    css({ padding: "[0.4em]" }),
                  )}
                >
                  {depth}
                  {solid ? " solid" : ""}
                </div>
              )),
            )}
          </div>
        </Section>

        <Section label="floating kinds">
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "[0.6em]",
              "--drawer-shadow-size": "0.5em",
            })}
          >
            {floatingKinds.map((kind) => (
              <div
                key={kind}
                className={cx(floating({ kind }), css({ padding: "[0.4em]" }))}
              >
                {kind}
              </div>
            ))}
          </div>
        </Section>

        <Section label="partyCell: header row, then odd / even, zero">
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "[1fr 3em 3em]",
              "& > *": { padding: "[0.2em]" },
            })}
          >
            {[
              { header: true, odd: true, zero: false, cells: ["", "Al", "Bo"] },
              {
                header: false,
                odd: true,
                zero: false,
                cells: ["Shoot", "2", "1"],
              },
              {
                header: false,
                odd: false,
                zero: false,
                cells: ["Run", "1", "3"],
              },
              {
                header: false,
                odd: true,
                zero: true,
                cells: ["Lie", "0", "0"],
              },
              {
                header: false,
                odd: false,
                zero: true,
                cells: ["Hide", "0", "0"],
              },
            ].flatMap(({ cells, ...variants }, i) =>
              cells.map((cell, j) =>
                variants.header || j === 0 ? (
                  <div
                    key={`${i}-${j}`}
                    className={partyCell({ ...variants, header: true })}
                  >
                    {cell}
                  </div>
                ) : (
                  // scores are links, as on the party sheet (AbilityRow)
                  <a
                    key={`${i}-${j}`}
                    className={cx(
                      partyCell(variants),
                      css({ display: "block", textAlign: "center" }),
                    )}
                  >
                    {cell}
                  </a>
                ),
              ),
            )}
          </div>
        </Section>
      </CSSReset>
    </div>
  );
};
