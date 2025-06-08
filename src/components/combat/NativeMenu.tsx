import { Menu } from "@ark-ui/react/menu";

export const NativeMenu = () => {
  return (
    <Menu.Root positioning={{}}>
      <Menu.Trigger>
        M <Menu.Indicator>➡️</Menu.Indicator>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content id="context-menu" className="themed theme-dark">
          <menu className="context-items">
            <Menu.Item value="react">React</Menu.Item>
            <Menu.Item value="solid">Solid</Menu.Item>
            <Menu.Item value="vue">Vue</Menu.Item>
          </menu>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};
