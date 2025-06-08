import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export const NativeMenu = () => {
  return (
    // <Menu.Root positioning={{}}>
    //   <Menu.Trigger>
    //     M <Menu.Indicator>➡️</Menu.Indicator>
    //   </Menu.Trigger>
    //   <Menu.Positioner>
    //     <Menu.Content
    //       id="context-menu"
    //       className="themed theme-dark"
    //       css={{ zIndex: 100000 }}
    //     >
    //       <menu className="context-items">
    //         <Menu.Item value="react">React</Menu.Item>
    //         <Menu.Item value="solid">Solid</Menu.Item>
    //         <Menu.Item value="vue">Vue</Menu.Item>
    //       </menu>
    //     </Menu.Content>
    //   </Menu.Positioner>
    // </Menu.Root>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>M</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          avoidCollisions
          align="start"
          side="bottom"
          css={{ position: "absolute", zIndex: 100000, width: "30em" }}
          id="context-menu"
          className="themed theme-dark"
        >
          <DropdownMenu.Label>A Label!</DropdownMenu.Label>
          <DropdownMenu.Item>An Item!</DropdownMenu.Item>
          <DropdownMenu.Item>Another Item!</DropdownMenu.Item>
          <DropdownMenu.Item>A third Item!</DropdownMenu.Item>

          <DropdownMenu.Group>
            <DropdownMenu.Item>An Item inna group!</DropdownMenu.Item>
            <DropdownMenu.Item>Another Item inna group!</DropdownMenu.Item>
          </DropdownMenu.Group>

          <DropdownMenu.Separator />
          <DropdownMenu.Arrow />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
