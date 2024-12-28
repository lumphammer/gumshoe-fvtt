import { RecursivePartial } from "./types";

declare global {
  namespace foundry {
    export namespace applications {
      export namespace api {
        export class ApplicationV2<TRenderResult = any> {
          constructor(
            options: RecursivePartial<foundry.applications.types.ApplicationConfiguration>,
          );

          // properties
          options: foundry.applications.types.ApplicationConfiguration;

          position: ApplicationPosition;

          static BASE_APPLICATION: typeof ApplicationV2;

          static DEFAULT_OPTIONS: RecursivePartial<
            Omit<
              foundry.applications.types.ApplicationConfiguration,
              "uniqueId"
            >
          >;

          static RENDER_STATES: Readonly<{
            ERROR: -3;
            CLOSING: -2;
            CLOSED: -1;
            NONE: 0;
            RENDERING: 1;
            RENDERED: 2;
          }>;

          // accessors
          get window(): {
            title: HTMLHeadingElement;
            icon: HTMLElement;
            close: HTMLButtonElement;
            controls: HTMLButtonElement;
            controlsDropdown: HTMLDivElement;
            onDrag: (...args: any[]) => any;
            dragStartPosition: ApplicationPosition;
            dragTime: number;
          };

          get classList(): DOMTokenList;

          get id(): string;

          get title(): string;

          get element(): HTMLElement;

          get minimized(): boolean;

          get rendered(): boolean;

          get state(): keyof typeof ApplicationV2.RENDER_STATES;

          get hasFrame(): boolean;

          // methods

          render(
            options?:
              | boolean
              | Partial<foundry.applications.types.ApplicationRenderOptions>,
            _options?: Partial<foundry.applications.types.ApplicationRenderOptions>,
          ): Promise<ApplicationV2>;

          // return type is not what foundry docs say, but in fact you do not
          // need to return anything
          _renderHTML(
            context: any,
            options: foundry.applications.types.ApplicationRenderOptions,
          ): Promise<TRenderResult> | void;

          _replaceHTML(
            result: TRenderResult,
            content: HTMLElement,
            options: foundry.applications.types.ApplicationRenderOptions,
          ): void;

          _renderFrame(options: unknown): Promise<HTMLElement>;

          _initializeApplicationOptions(
            options: foundry.applications.types.ApplicationConfiguration,
          ): foundry.applications.types.ApplicationConfiguration;

          close(options?: any): Promise<ApplicationV2>;

          setPosition(
            position?: Partial<ApplicationPosition>,
          ): ApplicationPosition;

          toggleControls(expanded?: boolean): void;

          minimize(): Promise<void>;

          maximize(): Promise<void>;

          _awaitTransition(
            element: HTMLElement,
            timeout: number,
          ): Promise<void>;

          // addEventListener(type: string, listener: EmittedEventListener, options?): void
          addEventListener(
            type: string,
            listener: (event: Event) => void,
            options?: Partial<{
              once: boolean;
            }>,
          ): void;

          removeEventListener(
            type: string,
            listener: (event: Event) => void,
          ): void;

          dispatchEvent(event: Event): boolean;

          static inheritanceChain(): Generator<
            typeof ApplicationV2,
            void,
            unknown
          >;

          parseCSSDimension(style: string, parentDimension: number): number;
        }
        export class DocumentSheetV2<TDocument> extends ApplicationV2 {
          document: TDocument;
        }
      }
      export namespace sheets {
        export class ItemSheetV2<TItem extends Item> extends foundry
          .applications.api.DocumentSheetV2<TItem> {
          item: TItem;
        }
        export class ActorSheetV2<TActor extends Actor> extends foundry
          .applications.api.DocumentSheetV2<TActor> {
          actor: TActor;
        }
      }

      interface ApplicationWindowRenderOptions {
        title: string;
        icon: string | false;
        controls: boolean;
      }

      interface ApplicationHeaderControlsEntry {
        icon: string;
        label: string;
        action: string;
        visible: boolean;
      }
      interface ApplicationPosition {
        top: number;
        left: number;
        width: number | "auto";
        height: number | "auto";
        scale: number;
        zIndex: number;
      }
      type ApplicationClickAction = (event: any, target: any) => any;
      export namespace types {
        export interface ApplicationRenderOptions {
          force: boolean;
          position: ApplicationPosition;
          window: ApplicationWindowRenderOptions;
          parts: string[];
        }
        export interface ApplicationWindowConfiguration {
          frame: boolean;
          positioned: boolean;
          title: string;
          icon: string | false;
          controls: ApplicationHeaderControlsEntry[];
          minimizable: boolean;
          resizable: boolean;
        }
        export interface ApplicationConfiguration {
          id: string;
          uniqueId: string;
          classes: string[];
          tag: string;
          window: foundry.applications.types.ApplicationWindowConfiguration;
          actions: Record<string, ApplicationClickAction>;
          position: Partial<ApplicationPosition>;
        }
      }
    }
  }
}
